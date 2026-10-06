package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "SampleTest", description = "A test case the learner can see.")
public record SampleTestResponse(
		@Schema(description = "Standard input for the program.", example = "3\n4\n") String input,
		@Schema(description = "Exact output expected.", example = "7\n") String expectedOutput) {
}
