package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Schema(name = "TutorExplainRequest")
public record TutorExplainRequest(
		@NotNull(message = "es obligatorio") @Positive(message = "debe ser mayor que 0") Long lessonId,
		@Schema(description = "What was not clear; optional.") @Size(max = 500, message = "admite hasta 500 caracteres") String question) {
}
