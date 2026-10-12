package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(name = "LabFile", description = "One file of a lab project, as text.")
public record LabFileDto(
		@NotBlank(message = "es obligatorio") @Size(max = 200, message = "admite hasta 200 caracteres") String path,
		@NotNull(message = "es obligatorio") @Size(max = 60_000, message = "admite hasta 60 KB") String content) {
}
