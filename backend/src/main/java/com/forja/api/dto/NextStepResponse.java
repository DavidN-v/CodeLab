package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * What the learner should do next on the one path through a course: a module's lessons, then its exercises,
 * then the next module.
 */
@Schema(name = "NextStep")
public record NextStepResponse(
		@Schema(description = "LESSON or EXERCISE.", example = "EXERCISE") Kind kind,
		@Schema(example = "hola-mundo") String slug,
		@Schema(example = "Hola, mundo") String title,
		@Schema(example = "fundamentos") String moduleSlug,
		@Schema(example = "Fundamentos de Java") String moduleTitle,
		@Schema(example = "1") int modulePosition) {

	public enum Kind {

		LESSON, EXERCISE

	}

}
