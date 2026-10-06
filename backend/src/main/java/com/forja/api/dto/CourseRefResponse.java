package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "CourseRef", description = "Enough of a course to link to it and label it.")
public record CourseRefResponse(
		@Schema(example = "1") Long id,
		@Schema(example = "java-desde-cero") String slug,
		@Schema(example = "Java desde cero") String title,
		@Schema(example = "java") String languageSlug,
		@Schema(example = "Java") String languageName) {
}
