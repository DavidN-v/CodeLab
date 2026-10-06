package com.forja.api.dto;

import com.forja.api.entity.SubmissionStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(name = "SubmissionResult", description = "Verdict of a submission, test by test.")
public record SubmissionResultResponse(
		@Schema(example = "42") Long id,
		SubmissionStatus status,
		@Schema(example = "4") int passedTests,
		@Schema(example = "5") int totalTests,
		@Schema(description = "Slowest test case, in milliseconds.") Integer executionTimeMs,
		@Schema(description = "Compiler messages when it did not compile.") String compileOutput,
		List<TestResultResponse> tests,
		@Schema(description = "True only the first time the learner solves this exercise.") boolean firstSolve,
		@Schema(description = "Experience earned by this submission.") int xpAwarded) {
}
