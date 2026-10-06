package com.forja.runner.docker;

/** The Docker Engine API could not be reached or rejected a request. */
public class DockerException extends RuntimeException {

	public DockerException(String message) {
		super(message);
	}

	public DockerException(String message, Throwable cause) {
		super(message, cause);
	}

}
