package com.forja.api.client;

import java.util.List;

/** Request and response of the code-runner's {@code POST /internal/executions}. */
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

	public record Run(int exitCode, boolean timedOut, String stdout, boolean stdoutTruncated, String stderr,
			boolean stderrTruncated, long durationMs) {
	}

}
