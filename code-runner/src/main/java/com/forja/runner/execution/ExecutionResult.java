package com.forja.runner.execution;

import java.util.List;

/**
 * @param status how far the execution got
 * @param compile compiler outcome; successful and empty for interpreted languages
 * @param runs one entry per input that ran, in input order
 * @param durationMs wall-clock time of the whole sandbox, including start-up
 */
public record ExecutionResult(ExecutionStatus status, CompileResult compile, List<RunResult> runs, long durationMs) {

	public record CompileResult(boolean success, String output, boolean outputTruncated, long durationMs) {
	}

	/**
	 * @param exitCode process exit code; 137 when it was killed
	 * @param timedOut whether the run hit the per-run time limit
	 */
	public record RunResult(int exitCode, boolean timedOut, String stdout, boolean stdoutTruncated, String stderr,
			boolean stderrTruncated, long durationMs) {
	}

}
