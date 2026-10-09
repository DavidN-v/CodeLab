package com.forja.api.dto;

public enum TestOutcome {

	PASSED, WRONG_OUTPUT, RUNTIME_ERROR, TIMEOUT,

	/** Skipped because an earlier case timed out. */
	NOT_RUN

}
