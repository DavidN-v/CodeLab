package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Schema(name = "DailyGoalRequest")
public record DailyGoalRequest(
		@Schema(description = "Experience per day.", example = "50") @Min(value = 10, message = "debe ser al menos 10")
		@Max(value = 500, message = "debe ser como mucho 500") int dailyGoalXp) {
}
