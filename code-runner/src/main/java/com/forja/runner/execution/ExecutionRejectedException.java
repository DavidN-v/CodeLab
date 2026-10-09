package com.forja.runner.execution;

/** The request is well-formed but asks for something the runner will not do. */
public class ExecutionRejectedException extends RuntimeException {

	public ExecutionRejectedException(String message) {
		super(message);
	}

}
