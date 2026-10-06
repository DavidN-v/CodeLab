package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "SubmissionRequest")
public record SubmissionRequest(
		@NotBlank(message = "no puede estar vacío") @Size(max = 65536, message = "admite hasta 64 KB") String sourceCode) {
}
