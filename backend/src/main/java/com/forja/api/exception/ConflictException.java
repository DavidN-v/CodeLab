package com.forja.api.exception;

/** The request clashes with existing data, e.g. registering an email that is taken. */
public class ConflictException extends RuntimeException {

	public ConflictException(String message) {
		super(message);
	}

}
