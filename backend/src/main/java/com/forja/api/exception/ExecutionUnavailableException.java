package com.forja.api.exception;

/** The code-runner is down, busy or failed for reasons unrelated to the submitted code. */
public class ExecutionUnavailableException extends RuntimeException {

	public ExecutionUnavailableException(String message, Throwable cause) {
		super(message, cause);
	}

}
