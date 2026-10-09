package com.forja.api.dto;

import com.forja.api.entity.SubmissionStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(name = "SubmissionSummary")
public record SubmissionSummaryResponse(
		Long id,
		SubmissionStatus status,
		int passedTests,
		int totalTests,
		Instant createdAt) {
}
