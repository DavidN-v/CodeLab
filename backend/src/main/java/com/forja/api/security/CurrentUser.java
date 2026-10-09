package com.forja.api.security;

import org.springframework.security.oauth2.jwt.Jwt;

/** Reads the learner behind a request from its access token, whose subject is the user id. */
public final class CurrentUser {

	private CurrentUser() {
	}

	public static Long id(Jwt token) {
		return Long.valueOf(token.getSubject());
	}

}
