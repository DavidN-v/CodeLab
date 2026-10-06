package com.forja.runner.execution;

public enum ExecutionStatus {

	/**
	 * Compiled and ran the inputs. Individual runs may still have failed; after a
	 * run times out the remaining inputs are skipped, so there can be fewer runs
	 * than inputs.
	 */
	COMPLETED,

	/** The compiler rejected the program; nothing ran. */
	COMPILATION_ERROR,

	/** The sandbox exceeded its overall time budget; runs that did not finish are missing. */
	TIMEOUT

}
