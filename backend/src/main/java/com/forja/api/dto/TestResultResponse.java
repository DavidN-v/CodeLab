package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "TestResult", description = "Outcome of one test case. Input and outputs are only filled in for sample cases.")
public record TestResultResponse(
		@Schema(example = "1") int position,
		boolean sample,
		TestOutcome outcome,
		String input,
		String expectedOutput,
		String actualOutput,
		String stderr) {
}
