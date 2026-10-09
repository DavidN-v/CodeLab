package com.forja.runner.execution;

/** The sandbox could not be created or run, for reasons unrelated to the program. */
public class SandboxUnavailableException extends RuntimeException {

	public SandboxUnavailableException(String message, Throwable cause) {
		super(message, cause);
	}

}
