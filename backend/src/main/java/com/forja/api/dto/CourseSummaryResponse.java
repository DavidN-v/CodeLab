package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "CourseSummary", description = "A course as shown in listings.")
public record CourseSummaryResponse(
		@Schema(example = "1") Long id,
		@Schema(example = "java-desde-cero") String slug,
		@Schema(example = "Java desde cero") String title,
		String summary,
		@Schema(description = "Slug of the language the course belongs to.", example = "java") String languageSlug) {
}
