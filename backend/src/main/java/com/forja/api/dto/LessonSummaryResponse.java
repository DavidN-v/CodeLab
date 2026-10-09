package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LessonSummary", description = "A lesson as listed inside its module.")
public record LessonSummaryResponse(
		@Schema(example = "12") Long id,
		@Schema(example = "declarar-variables") String slug,
		@Schema(example = "Declarar e inicializar variables") String title,
		String summary,
		@Schema(example = "10") int estimatedMinutes,
		@Schema(description = "1-based position inside the module.", example = "1") int position) {
}
