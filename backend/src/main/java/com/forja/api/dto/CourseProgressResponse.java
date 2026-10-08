package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(name = "CourseProgress", description = "The learner's progress through one course.")
public record CourseProgressResponse(
		Long courseId,
		int completedLessons,
		int totalLessons,
		int solvedExercises,
		int totalExercises,
		@Schema(description = "Lessons and exercises done, as a whole percentage.", example = "36") int percent,
		List<Long> completedLessonIds,
		List<String> solvedExerciseSlugs,
		@Schema(description = "Exercises submitted at least once but not solved yet.") List<String> attemptedExerciseSlugs,
		List<ModuleProgressResponse> modules,
		@Schema(description = "First lesson not completed yet, in reading order; null when all are done.") LessonRefResponse nextLesson,
		@Schema(description = "Next lesson or exercise on the path: a module's lessons, then its exercises; null when all are done.") NextStepResponse nextStep) {
}
