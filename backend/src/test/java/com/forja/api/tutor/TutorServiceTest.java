package com.forja.api.tutor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.forja.api.entity.Exercise;
import com.forja.api.exception.TooManyRequestsException;
import com.forja.api.learning.RateLimiter;
import com.forja.api.repository.ExerciseRepository;
import com.forja.api.repository.LessonRepository;
import java.time.Clock;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;

class TutorServiceTest {

	private final List<String> prompts = new ArrayList<>();

	private String reply = "Mira la condición del bucle.";

	private final ExerciseRepository exercises = mock(ExerciseRepository.class);

	private TutorService service;

	@BeforeEach
	void setUp() {
		TutorModel model = (system, prompt) -> {
			prompts.add(prompt);
			return reply;
		};
		Exercise exercise = mock(Exercise.class);
		when(exercise.getTitle()).thenReturn("Contar hasta diez");
		when(exercise.getStatementMarkdown()).thenReturn("Imprime del 1 al 10.");
		when(exercises.findPublishedBySlug("contar")).thenReturn(Optional.of(exercise));
		service = new TutorService(model, new TutorProperties("key", "claude-opus-5-5", "medium", Duration.ofSeconds(5)),
				mock(LessonRepository.class), exercises, new RateLimiter(2, Duration.ofMinutes(1), Clock.systemUTC()),
				mock(PlatformTransactionManager.class));
	}

	@Test
	void aDebugPromptCarriesTheExerciseTheCodeAndTheResultButAsksForNoSolution() {
		String answer = service.debug(1L, "contar", "for (int i = 0; i < 10; i++)", "Esperado 1..10, obtenido 0..9");

		assertThat(answer).isEqualTo("Mira la condición del bucle.");
		assertThat(prompts.get(0)).contains("Contar hasta diez", "i < 10", "obtenido 0..9", "No escribas el programa corregido");
	}

	@Test
	void aDeclinedRequestGetsAFriendlyMessage() {
		reply = null;

		assertThat(service.review(1L, "contar", "class Main {}")).startsWith("No puedo ayudarte con eso");
	}

	@Test
	void questionsAreRateLimitedPerLearner() {
		service.review(1L, "contar", "a");
		service.review(1L, "contar", "b");

		assertThatThrownBy(() -> service.review(1L, "contar", "c")).isInstanceOf(TooManyRequestsException.class);
		assertThat(service.review(2L, "contar", "d")).isNotBlank();
	}

}
