package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ModuleRef", description = "Enough of a module to link to it and label it.")
public record ModuleRefResponse(
		@Schema(example = "2") Long id,
		@Schema(example = "variables") String slug,
		@Schema(example = "Variables") String title,
		@Schema(description = "1-based position inside the course.", example = "2") int position) {
}
