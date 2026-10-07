package com.forja.api.dto;

import com.forja.api.entity.Difficulty;
import com.forja.api.entity.ExerciseKind;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ExerciseSummary", description = "An exercise as shown in listings.")
public record ExerciseSummaryResponse(
		@Schema(example = "7") Long id,
		@Schema(example = "intercambiar-valores") String slug,
		@Schema(example = "Intercambiar valores") String title,
		String summary,
		Difficulty difficulty,
		ExerciseKind kind,
		ModuleRefResponse module) {
}
