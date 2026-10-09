package com.forja.api.client;

import java.util.List;
import tools.jackson.databind.JsonNode;

/** Requests and responses of the code-runner's internal API. */
public final class RunnerExecution {

	private RunnerExecution() {
	}

	/** @param inputs stdin for each run; the program runs once per entry */
	public record Request(String language, String sourceCode, List<String> inputs) {
	}

	/**
	 * @param status COMPLETED, COMPILATION_ERROR or TIMEOUT
	 * @param runs one per input that ran, in order; after a run times out the
	 * remaining inputs are skipped
	 */
	public record Result(String status, Compile compile, List<Run> runs, long durationMs) {

		public boolean compiled() {
			return compile != null && compile.success();
		}

	}

	public record Compile(boolean success, String output, boolean outputTruncated, long durationMs) {
	}

	/** Request of {@code POST /internal/traces}. */
	public record TraceRequest(String language, String sourceCode, String stdin) {
	}

	/**
	 * @param status COMPLETED when there is a trace, COMPILATION_ERROR or TIMEOUT otherwise
	 * @param trace the tracer's document: steps, output, exit code and uncaught exception
	 */
	public record TraceResult(String status, Compile compile, JsonNode trace, String error) {
	}

	public record Run(int exitCode, boolean timedOut, String stdout, boolean stdoutTruncated, String stderr,
			boolean stderrTruncated, long durationMs) {
	}

}
