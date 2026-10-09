package com.forja.runner.execution;

import java.util.List;

/**
 * What the harness reported, decoded but not yet interpreted.
 *
 * @param compile null if the harness did not get as far as reporting it
 * @param runs runs in the order they were reported
 * @param complete whether the end marker was seen
 */
record HarnessOutput(Step compile, Captured compileOutput, List<Run> runs, boolean complete) {

	record Step(int exitCode, long millis) {
	}

	record Run(int index, int exitCode, long millis, Captured stdout, Captured stderr) {
	}

	/**
	 * @param text the captured bytes as UTF-8, possibly cut short
	 * @param truncated whether the stream produced more than was kept
	 */
	record Captured(String text, boolean truncated) {

		static final Captured EMPTY = new Captured("", false);

	}

}
