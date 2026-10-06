package com.forja.api.exception;

public class InvalidCredentialsException extends RuntimeException {

	public InvalidCredentialsException() {
		super("El correo o la contraseña no son correctos.");
	}

}
