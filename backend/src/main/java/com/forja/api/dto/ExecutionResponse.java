package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ExecutionResult", description = "What a playground run produced.")
public record ExecutionResponse(
		ExecutionOutcome status,
		@Schema(description = "Compiler messages; empty when it compiled cleanly.") String compileOutput,
		String stdout,
		String stderr,
		@Schema(description = "Process exit code; null if the program never ran.") Integer exitCode,
		@Schema(description = "Run time of the program itself, excluding compilation.") long durationMs,
		@Schema(description = "Whether stdout or stderr was cut at the output limit.") boolean outputTruncated) {
}
