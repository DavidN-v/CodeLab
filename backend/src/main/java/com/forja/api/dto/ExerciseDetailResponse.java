package com.forja.api.dto;

import com.forja.api.entity.Difficulty;
import com.forja.api.entity.ExerciseKind;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(name = "ExerciseDetail", description = "Everything needed to attempt an exercise. Hidden tests, hints and the solution are not included.")
public record ExerciseDetailResponse(
		@Schema(example = "7") Long id,
		@Schema(example = "intercambiar-valores") String slug,
		@Schema(example = "Intercambiar valores") String title,
		String summary,
		Difficulty difficulty,
		ExerciseKind kind,
		@Schema(description = "Statement in CommonMark.") String statementMarkdown,
		@Schema(description = "Starting code. FILL: the program with {{?}} blanks. PARSONS: the skeleton with a {{lines}} line. PREDICT: the program to read.") String starterCode,
		@Schema(description = "PARSONS only: the lines to order, shuffled, including some that do not belong.") List<String> parsonsLines,
		List<SampleTestResponse> samples,
		@Schema(description = "Sample and hidden test cases together.", example = "5") int totalTests,
		@Schema(example = "3") int hintCount,
		@Schema(description = "Experience points for solving it without help.", example = "20") int xp,
		CourseRefResponse course,
		ModuleRefResponse module,
		@Schema(description = "Previous exercise in course order; null for the first.") ExerciseSummaryResponse previous,
		@Schema(description = "Next exercise in course order; null for the last.") ExerciseSummaryResponse next) {
}
