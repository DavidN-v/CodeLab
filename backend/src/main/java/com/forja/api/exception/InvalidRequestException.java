package com.forja.api.exception;

/** A well-formed request the API refuses, with a message the learner can act on. */
public class InvalidRequestException extends RuntimeException {

	public InvalidRequestException(String message) {
		super(message);
	}

}
