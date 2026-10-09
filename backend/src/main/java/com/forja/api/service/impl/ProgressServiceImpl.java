package com.forja.api.service.impl;

import com.forja.api.dto.CourseProgressResponse;
import com.forja.api.dto.LessonCompletionResponse;
import com.forja.api.entity.ExerciseProgress;
import com.forja.api.entity.Lesson;
import com.forja.api.entity.LessonProgress;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.learning.XpPolicy;
import com.forja.api.repository.CourseRepository;
import com.forja.api.repository.ExerciseOutline;
import com.forja.api.repository.ExerciseProgressRepository;
import com.forja.api.repository.ExerciseRepository;
import com.forja.api.repository.LessonOutline;
import com.forja.api.repository.LessonProgressRepository;
import com.forja.api.repository.LessonRepository;
import com.forja.api.repository.UserRepository;
import com.forja.api.service.ProgressService;
import java.time.Clock;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProgressServiceImpl implements ProgressService {

	private final LessonRepository lessonRepository;

	private final ExerciseRepository exerciseRepository;

	private final CourseRepository courseRepository;

	private final LessonProgressRepository lessonProgressRepository;

	private final ExerciseProgressRepository exerciseProgressRepository;

	private final UserRepository userRepository;

	private final CourseProgressCalculator calculator;

	private final Clock clock;

	private final ExperienceTracker experienceTracker;

	public ProgressServiceImpl(LessonRepository lessonRepository, ExerciseRepository exerciseRepository,
			CourseRepository courseRepository, LessonProgressRepository lessonProgressRepository,
			ExerciseProgressRepository exerciseProgressRepository, UserRepository userRepository,
			CourseProgressCalculator calculator, Clock clock, ExperienceTracker experienceTracker) {
		this.experienceTracker = experienceTracker;
		this.lessonRepository = lessonRepository;
		this.exerciseRepository = exerciseRepository;
		this.courseRepository = courseRepository;
		this.lessonProgressRepository = lessonProgressRepository;
		this.exerciseProgressRepository = exerciseProgressRepository;
		this.userRepository = userRepository;
		this.calculator = calculator;
		this.clock = clock;
	}

	@Override
	public LessonCompletionResponse completeLesson(Long userId, Long lessonId) {
		Lesson lesson = lessonRepository.findPublishedById(lessonId)
			.orElseThrow(() -> new ResourceNotFoundException("No existe la lección con id %d.".formatted(lessonId)));
		return lessonProgressRepository.findByUserIdAndLessonId(userId, lessonId)
			.map(existing -> new LessonCompletionResponse(lessonId, existing.getCompletedAt(), false, 0, null))
			.orElseGet(() -> {
				LessonProgress progress = lessonProgressRepository
					.saveAndFlush(new LessonProgress(userRepository.getReferenceById(userId), lesson, clock.instant()));
				return new LessonCompletionResponse(lessonId, progress.getCompletedAt(), true, XpPolicy.LESSON_XP,
						experienceTracker.celebrate(userId, XpPolicy.LESSON_XP, lesson.getModule()));
			});
	}

	@Override
	@Transactional(readOnly = true)
	public CourseProgressResponse findCourseProgress(Long userId, Long courseId) {
		if (courseRepository.findByIdAndPublishedTrue(courseId).isEmpty()) {
			throw new ResourceNotFoundException("No existe el curso con id %d.".formatted(courseId));
		}
		List<LessonOutline> lessons = lessonRepository.findOutlinesByCourse(courseId);
		List<ExerciseOutline> exercises = exerciseRepository.findOutlinesByCourse(courseId);
		Set<Long> completed = lessonProgressRepository.findByUserId(userId)
			.stream()
			.map(progress -> progress.getLesson().getId())
			.collect(Collectors.toSet());
		List<ExerciseProgress> exerciseProgress = exerciseProgressRepository.findByUserId(userId);
		Set<Long> solved = exerciseProgress.stream()
			.filter(ExerciseProgress::isSolved)
			.map(progress -> progress.getExercise().getId())
			.collect(Collectors.toSet());
		Set<Long> attempted = exerciseProgress.stream()
			.filter(progress -> progress.getAttempts() > 0)
			.map(progress -> progress.getExercise().getId())
			.collect(Collectors.toSet());
		return calculator.calculate(courseId, lessons, exercises, completed, solved, attempted);
	}

}
