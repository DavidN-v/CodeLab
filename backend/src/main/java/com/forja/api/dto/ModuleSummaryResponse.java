package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ModuleSummary", description = "A module as shown inside its course outline.")
public record ModuleSummaryResponse(
		@Schema(example = "5") Long id,
		@Schema(example = "condicionales") String slug,
		@Schema(example = "Condicionales") String title,
		String summary,
		@Schema(description = "1-based position inside the course.", example = "5") int position,
		@Schema(description = "False while the module is announced but its content is not available yet.") boolean published) {
}
