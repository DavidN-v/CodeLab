package com.forja.api.dto;

public enum ExecutionOutcome {

	/** Ran and exited with code 0. */
	SUCCESS,

	COMPILATION_ERROR,

	/** Ran but exited with a non-zero code, usually an uncaught exception. */
	RUNTIME_ERROR,

	/** Hit the time limit and was stopped. */
	TIMEOUT

}
