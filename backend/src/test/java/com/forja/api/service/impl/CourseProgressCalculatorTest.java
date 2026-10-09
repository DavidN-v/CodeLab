package com.forja.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import com.forja.api.dto.NextStepResponse;
import com.forja.api.entity.Difficulty;
import com.forja.api.entity.ExerciseKind;
import com.forja.api.mapper.RefMapper;
import com.forja.api.repository.ExerciseOutline;
import com.forja.api.repository.LessonOutline;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class CourseProgressCalculatorTest {

	private final CourseProgressCalculator calculator = new CourseProgressCalculator(new RefMapper());

	private final List<LessonOutline> lessons = List.of(lesson(1L, "que-es-java", 1), lesson(2L, "primer-programa", 1),
			lesson(3L, "declarar", 2));

	private final List<ExerciseOutline> exercises = List.of(exercise(10L, "hola-mundo", 1),
			exercise(11L, "eco", 1), exercise(20L, "cajas", 2));

	@Test
	void startsWithTheFirstLesson() {
		assertThat(next(Set.of(), Set.of())).extracting(NextStepResponse::kind, NextStepResponse::slug)
			.containsExactly(NextStepResponse.Kind.LESSON, "que-es-java");
	}

	@Test
	void practisesTheModuleBeforeMovingOn() {
		assertThat(next(Set.of(1L, 2L), Set.of(10L))).extracting(NextStepResponse::kind, NextStepResponse::slug)
			.containsExactly(NextStepResponse.Kind.EXERCISE, "eco");
	}

	@Test
	void movesToTheNextModuleOnceThisOneIsDone() {
		assertThat(next(Set.of(1L, 2L), Set.of(10L, 11L))).extracting(NextStepResponse::kind,
				NextStepResponse::slug, NextStepResponse::modulePosition)
			.containsExactly(NextStepResponse.Kind.LESSON, "declarar", 2);
	}

	@Test
	void hasNothingLeftWhenAllIsDone() {
		assertThat(next(Set.of(1L, 2L, 3L), Set.of(10L, 11L, 20L))).isNull();
	}

	private NextStepResponse next(Set<Long> completed, Set<Long> solved) {
		return calculator.calculate(1L, lessons, exercises, completed, solved, Set.of()).nextStep();
	}

	private static LessonOutline lesson(Long id, String slug, int module) {
		return new LessonOutline(id, slug, slug, "", 5, id.intValue(), (long) module, "m" + module, "Módulo " + module,
				module);
	}

	private static ExerciseOutline exercise(Long id, String slug, int module) {
		return new ExerciseOutline(id, slug, slug, "", Difficulty.EASY, ExerciseKind.CODE, id.intValue(),
				(long) module, "m" + module, "Módulo " + module, module);
	}

}
