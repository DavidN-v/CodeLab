package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Language", description = "A programming language or technology that can be learned on the platform.")
public record LanguageResponse(
		@Schema(example = "1") Long id,
		@Schema(description = "URL-safe identifier.", example = "java") String slug,
		@Schema(example = "Java") String name,
		@Schema(description = "Version the content targets.", example = "21") String version,
		@Schema(description = "Icon key resolved by the client.", example = "java") String icon,
		@Schema(example = "Aprende Java desde cero hasta construir aplicaciones reales.") String tagline,
		String description,
		@Schema(description = "Whether the language has content available to learners.") boolean active) {
}
