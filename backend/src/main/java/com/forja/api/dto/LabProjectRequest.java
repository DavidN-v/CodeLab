package com.forja.api.dto;

import com.forja.api.entity.LabMode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(name = "LabProjectRequest")
public record LabProjectRequest(
		@NotBlank(message = "es obligatorio") @Size(max = 120, message = "admite hasta 120 caracteres") String name,
		@Size(max = 500, message = "admite hasta 500 caracteres") String description,
		@NotNull(message = "es obligatorio") LabMode mode,
		@Schema(description = "JSON with the idea, files, tests and plan of the project.") @NotBlank(
				message = "no puede estar vacío") @Size(max = 400_000, message = "admite hasta 400 KB") String content,
		@Schema(description = "Folder the learner keeps it in; empty or absent for none.") @Size(max = 60,
				message = "admite hasta 60 caracteres") String folder) {
}
