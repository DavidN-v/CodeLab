package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "LabPlanRequest")
public record LabPlanRequest(
		@Schema(description = "What the learner wants to build, in their own words.") @NotBlank(
				message = "es obligatorio") @Size(max = 2000, message = "admite hasta 2000 caracteres") String idea,
		@Schema(description = "The learner's answers to the tutor's earlier questions, if any.") @Size(max = 2000,
				message = "admite hasta 2000 caracteres") String answers) {
}
