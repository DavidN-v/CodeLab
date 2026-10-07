package com.forja.api.exception;

/** The AI tutor is switched off or its model cannot be reached. */
public class TutorUnavailableException extends RuntimeException {

	public TutorUnavailableException(String message) {
		super(message);
	}

	public TutorUnavailableException(String message, Throwable cause) {
		super(message, cause);
	}

}
