package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(name = "ModuleDetail", description = "A module with its lessons and exercises, in order.")
public record ModuleDetailResponse(
		@Schema(example = "2") Long id,
		@Schema(example = "variables") String slug,
		@Schema(example = "Variables") String title,
		String summary,
		@Schema(example = "2") int position,
		CourseRefResponse course,
		List<LessonSummaryResponse> lessons,
		List<ExerciseSummaryResponse> exercises,
		@Schema(description = "Previous published module; null for the first.") ModuleRefResponse previous,
		@Schema(description = "Next published module; null for the last.") ModuleRefResponse next) {
}
