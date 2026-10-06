package com.forja.runner.execution;

public enum ExecutionStatus {

	/** Compiled and ran every input. Individual runs may still have failed or timed out. */
	COMPLETED,

	/** The compiler rejected the program; nothing ran. */
	COMPILATION_ERROR,

	/** The sandbox exceeded its overall time budget; runs that did not finish are missing. */
	TIMEOUT

}
