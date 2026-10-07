package com.forja.api.dto;

import com.forja.api.util.SlugRules;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(name = "TutorCodeRequest")
public record TutorCodeRequest(
		@NotBlank(message = "es obligatorio") @Pattern(regexp = SlugRules.PATTERN, message = SlugRules.MESSAGE) String exerciseSlug,
		@NotBlank(message = "no puede estar vacío") @Size(max = 65536, message = "admite hasta 64 KB") String sourceCode,
		@Schema(description = "Debug only: what the last run or submission produced, as text.") @Size(max = 20000, message = "admite hasta 20000 caracteres") String result) {
}
