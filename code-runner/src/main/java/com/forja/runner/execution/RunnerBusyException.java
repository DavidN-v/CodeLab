package com.forja.runner.execution;

/** Every sandbox slot stayed busy for longer than the queue timeout. */
public class RunnerBusyException extends RuntimeException {

	public RunnerBusyException(String message) {
		super(message);
	}

}
