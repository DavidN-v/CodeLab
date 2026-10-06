package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "RegisterRequest")
public record RegisterRequest(
		@Schema(example = "ada@example.com") @NotBlank(message = "es obligatorio") @Email(message = "no es un correo válido") @Size(max = 254) String email,
		@Schema(example = "Ada") @NotBlank(message = "es obligatorio") @Size(max = 60, message = "admite hasta 60 caracteres") String displayName,
		@Schema(example = "una-contraseña-larga") @NotBlank(message = "es obligatoria") @Size(min = 8, max = 72, message = "debe tener entre 8 y 72 caracteres") String password) {
}
