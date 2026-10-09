package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(name = "GlossaryTerm")
public record GlossaryTermResponse(
		@Schema(example = "variable") String term,
		@Schema(description = "Other spellings found in lessons, e.g. plurals.") List<String> aliases,
		@Schema(example = "Un nombre que guarda un valor que puede cambiar.") String definition) {
}
