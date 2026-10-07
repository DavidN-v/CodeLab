package com.forja.api.exception;

/** The AI tutor is switched off or its model cannot be reached. */
public class TutorUnavailableException extends RuntimeException {

	/** What to tell the learner (or whoever runs the server), in Spanish. */
	private final String userMessage;

	public TutorUnavailableException(String message) {
		this(message, null, null);
	}

	public TutorUnavailableException(String message, String userMessage, Throwable cause) {
		super(message, cause);
		this.userMessage = userMessage;
	}

	/** Null when the generic message is enough. */
	public String userMessage() {
		return userMessage;
	}

}
