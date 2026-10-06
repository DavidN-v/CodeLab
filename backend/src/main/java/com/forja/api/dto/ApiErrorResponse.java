package com.forja.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.forja.api.exception.ErrorCode;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatusCode;

@Schema(name = "ApiError", description = "Body returned by every failed request.")
public record ApiErrorResponse(
		Instant timestamp,
		@Schema(example = "404") int status,
		@Schema(description = "Stable machine-readable code.", example = "RESOURCE_NOT_FOUND") String error,
		@Schema(description = "Human-readable explanation.", example = "No existe el lenguaje 'cobol'.") String message,
		@Schema(example = "/api/languages/cobol") String path,
		@Schema(description = "Per-field problems; only present for validation errors.")
		@JsonInclude(JsonInclude.Include.NON_EMPTY) List<FieldErrorDetail> fieldErrors) {

	public static ApiErrorResponse of(HttpStatusCode status, ErrorCode code, String message, String path) {
		return of(status, code, message, path, List.of());
	}

	public static ApiErrorResponse of(HttpStatusCode status, ErrorCode code, String message, String path,
			List<FieldErrorDetail> fieldErrors) {
		return new ApiErrorResponse(Instant.now(), status.value(), code.name(), message, path, fieldErrors);
	}

	@Schema(name = "FieldError")
	public record FieldErrorDetail(
			@Schema(example = "language") String field,
			@Schema(example = "debe coincidir con el formato de un slug") String message) {
	}

}
