package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "LoginRequest")
public record LoginRequest(
		@Schema(example = "ada@example.com") @NotBlank(message = "es obligatorio") String email,
		@NotBlank(message = "es obligatoria") String password) {
}
