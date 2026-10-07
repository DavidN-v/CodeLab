package com.forja.api.learning;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class LearningAidsTest {

	private static final Instant NOW = Instant.parse("2026-10-07T10:00:00Z");

	@Test
	void reviewsGetFurtherApartUntilTheExerciseIsLearned() {
		assertThat(ReviewSchedule.next(0, NOW)).isEqualTo(NOW.plus(Duration.ofDays(1)));
		assertThat(ReviewSchedule.next(1, NOW)).isEqualTo(NOW.plus(Duration.ofDays(3)));
		assertThat(ReviewSchedule.next(4, NOW)).isEqualTo(NOW.plus(Duration.ofDays(60)));
		assertThat(ReviewSchedule.next(5, NOW)).isNull();
	}

	@Test
	void parsonsLinesAreShuffledTheSameWayEveryTimeAndNeverInOrder() {
		ParsonsPuzzle.Data data = new ParsonsPuzzle.Data(List.of("a", "b", "c", "d"), List.of("x"));

		List<String> first = ParsonsPuzzle.shuffled("sumar", data);

		assertThat(first).containsExactlyInAnyOrder("a", "b", "c", "d", "x");
		assertThat(first.subList(0, 4)).isNotEqualTo(List.of("a", "b", "c", "d"));
		assertThat(ParsonsPuzzle.shuffled("sumar", data)).isEqualTo(first);
	}

	@Test
	void predictionFeedbackPointsAtTheFirstWrongLineWithoutTheAnswer() {
		String feedback = PredictionFeedback.describe("1\n2\n3\n", "1\n5\n3");

		assertThat(feedback).isEqualTo("Aciertas 2 de 3 líneas. Revisa la línea 2.");
	}

	@Test
	void predictionFeedbackMentionsAMissingLine() {
		assertThat(PredictionFeedback.describe("hola\nadiós\n", "hola"))
			.isEqualTo("Aciertas 1 de 2 líneas. El programa imprime 2 líneas y tu respuesta tiene 1. Revisa la línea 2.");
	}

}
