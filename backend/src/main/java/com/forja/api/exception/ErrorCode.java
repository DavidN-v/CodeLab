package com.forja.api.exception;

import org.springframework.http.HttpStatusCode;

/**
 * Stable error identifiers exposed in {@code ApiErrorResponse.error}. Clients
 * branch on these, so existing names must not be renamed.
 */
public enum ErrorCode {

	VALIDATION_ERROR("La solicitud contiene datos no válidos."),
	BAD_REQUEST("La solicitud no se puede procesar."),
	UNAUTHORIZED("Necesitas iniciar sesión para acceder a este recurso."),
	FORBIDDEN("No tienes permiso para realizar esta acción."),
	RESOURCE_NOT_FOUND("El recurso solicitado no existe."),
	METHOD_NOT_ALLOWED("El método HTTP no está permitido para este recurso."),
	CONFLICT("La operación entra en conflicto con el estado actual del recurso."),
	TOO_MANY_REQUESTS("Has hecho demasiadas solicitudes seguidas. Espera un momento e inténtalo de nuevo."),
	EXECUTION_UNAVAILABLE("El entorno de ejecución no está disponible ahora mismo. Inténtalo de nuevo en unos segundos."),
	TUTOR_UNAVAILABLE("El tutor no está disponible ahora mismo. Inténtalo de nuevo más tarde."),
	INTERNAL_ERROR("Ha ocurrido un error inesperado. Inténtalo de nuevo más tarde.");

	private final String defaultMessage;

	ErrorCode(String defaultMessage) {
		this.defaultMessage = defaultMessage;
	}

	public String defaultMessage() {
		return defaultMessage;
	}

	public static ErrorCode fromStatus(HttpStatusCode status) {
		return switch (status.value()) {
			case 401 -> UNAUTHORIZED;
			case 403 -> FORBIDDEN;
			case 404 -> RESOURCE_NOT_FOUND;
			case 405 -> METHOD_NOT_ALLOWED;
			case 409 -> CONFLICT;
			case 429 -> TOO_MANY_REQUESTS;
			default -> status.is4xxClientError() ? BAD_REQUEST : INTERNAL_ERROR;
		};
	}

}
