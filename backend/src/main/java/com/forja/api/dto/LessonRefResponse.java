package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LessonRef", description = "Enough of a lesson to link to it, possibly in another module.")
public record LessonRefResponse(
		@Schema(example = "12") Long id,
		@Schema(example = "declarar-variables") String slug,
		@Schema(example = "Declarar e inicializar variables") String title,
		@Schema(example = "variables") String moduleSlug,
		@Schema(example = "Variables") String moduleTitle) {
}
