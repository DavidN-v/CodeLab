package com.forja.api.tutor;

import com.forja.api.entity.Exercise;
import com.forja.api.entity.Lesson;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.exception.TooManyRequestsException;
import com.forja.api.learning.RateLimiter;
import com.forja.api.repository.ExerciseRepository;
import com.forja.api.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * The AI tutor: explains a lesson another way, points at the bug in a failing
 * program without solving it, and reviews a solved one. The model call happens
 * outside any database transaction.
 */
@Service
public class TutorService {

	private static final String DECLINED = "No puedo ayudarte con eso. Prueba a preguntar de otra forma "
			+ "sobre la lección o el ejercicio.";

	private static final int MAX_LESSON_CHARS = 12_000;

	private final TutorModel model;

	private final TutorProperties properties;

	private final LessonRepository lessonRepository;

	private final ExerciseRepository exerciseRepository;

	private final RateLimiter rateLimiter;

	private final TransactionTemplate readTransaction;

	public TutorService(TutorModel model, TutorProperties properties, LessonRepository lessonRepository,
			ExerciseRepository exerciseRepository, @Qualifier("tutorRateLimiter") RateLimiter rateLimiter,
			PlatformTransactionManager transactionManager) {
		this.model = model;
		this.properties = properties;
		this.lessonRepository = lessonRepository;
		this.exerciseRepository = exerciseRepository;
		this.rateLimiter = rateLimiter;
		this.readTransaction = new TransactionTemplate(transactionManager);
		this.readTransaction.setReadOnly(true);
	}

	public boolean enabled() {
		return properties.enabled();
	}

	public String explainLesson(Long userId, Long lessonId, String question) {
		admit(userId);
		String prompt = readTransaction.execute(status -> {
			Lesson lesson = lessonRepository.findPublishedById(lessonId)
				.orElseThrow(() -> new ResourceNotFoundException("No existe la lección con id %d.".formatted(lessonId)));
			String asked = question == null || question.isBlank() ? TutorPrompts.DEFAULT_QUESTION
					: "Su pregunta: " + question.strip();
			return TutorPrompts.EXPLAIN.formatted(asked, lesson.getTitle(), clip(lesson.getContentMarkdown()));
		});
		return ask(prompt);
	}

	public String debug(Long userId, String exerciseSlug, String sourceCode, String result) {
		admit(userId);
		Exercise exercise = findExercise(exerciseSlug);
		return ask(TutorPrompts.DEBUG.formatted(exercise.getTitle(), exercise.getStatementMarkdown(), sourceCode,
				result == null || result.isBlank() ? "(no lo ha ejecutado todavía)" : result));
	}

	public String review(Long userId, String exerciseSlug, String sourceCode) {
		admit(userId);
		Exercise exercise = findExercise(exerciseSlug);
		return ask(TutorPrompts.REVIEW.formatted(exercise.getTitle(), exercise.getStatementMarkdown(), sourceCode));
	}

	private Exercise findExercise(String slug) {
		return readTransaction.execute(status -> exerciseRepository.findPublishedBySlug(slug)
			.orElseThrow(() -> new ResourceNotFoundException("No existe el ejercicio '%s'.".formatted(slug))));
	}

	private void admit(Long userId) {
		if (!rateLimiter.tryAcquire(userId)) {
			throw new TooManyRequestsException("Has preguntado mucho al tutor en poco tiempo. Espera un minuto.");
		}
	}

	private String ask(String prompt) {
		String answer = model.answer(TutorPrompts.SYSTEM, prompt);
		return answer == null || answer.isBlank() ? DECLINED : answer;
	}

	private static String clip(String text) {
		return text.length() <= MAX_LESSON_CHARS ? text : text.substring(0, MAX_LESSON_CHARS);
	}

}
