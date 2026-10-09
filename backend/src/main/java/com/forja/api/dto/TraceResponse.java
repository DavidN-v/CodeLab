package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.JsonNode;

@Schema(name = "TraceResult", description = "A program run step by step, for the visualizer.")
public record TraceResponse(
		@Schema(description = "TRACED when there are steps; COMPILATION_ERROR; or TOO_LONG when it could not be traced in time.") TraceOutcome status,
		@Schema(description = "Compiler messages.") String compileOutput,
		@Schema(description = "steps (line, frames with variables, statics, heap, output printed at that step, value returned), stdout, stderr, exitCode, exception {type, message, line} and stopped (null, steps or time when it was cut short).") JsonNode trace) {

	public enum TraceOutcome {

		TRACED, COMPILATION_ERROR, TOO_LONG

	}

}
