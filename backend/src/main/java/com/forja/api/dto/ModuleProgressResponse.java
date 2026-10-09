package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ModuleProgress")
public record ModuleProgressResponse(
		Long moduleId,
		String slug,
		int completedLessons,
		int totalLessons,
		int solvedExercises,
		int totalExercises,
		@Schema(description = "Every lesson read and every exercise solved.") boolean completed) {
}
