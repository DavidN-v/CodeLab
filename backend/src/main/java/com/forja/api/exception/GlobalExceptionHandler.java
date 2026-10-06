package com.forja.api.exception;

import com.forja.api.dto.ApiErrorResponse;
import com.forja.api.dto.ApiErrorResponse.FieldErrorDetail;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Translates every exception raised while handling a request into an
 * {@link ApiErrorResponse}. Extending {@link ResponseEntityExceptionHandler}
 * keeps the correct status for Spring MVC's own exceptions (405, 415, ...)
 * instead of collapsing them into a 500.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(ResourceNotFoundException.class)
	public ResponseEntity<Object> handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
		return respond(HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND, ex.getMessage(), List.of(), request);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<Object> handleConstraintViolation(ConstraintViolationException ex, WebRequest request) {
		List<FieldErrorDetail> fieldErrors = ex.getConstraintViolations().stream()
			.map(violation -> new FieldErrorDetail(violation.getPropertyPath().toString(), violation.getMessage()))
			.toList();
		return respondValidationError(fieldErrors, request);
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<Object> handleDataIntegrityViolation(DataIntegrityViolationException ex,
			WebRequest request) {
		log.warn("Data integrity violation on {}: {}", pathOf(request), ex.getMostSpecificCause().getMessage());
		return respond(HttpStatus.CONFLICT, ErrorCode.CONFLICT, ErrorCode.CONFLICT.defaultMessage(), List.of(),
				request);
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<Object> handleAuthentication(AuthenticationException ex, WebRequest request) {
		return respond(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, ErrorCode.UNAUTHORIZED.defaultMessage(),
				List.of(), request);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<Object> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
		return respond(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, ErrorCode.FORBIDDEN.defaultMessage(), List.of(),
				request);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Object> handleUnexpected(Exception ex, WebRequest request) {
		log.error("Unhandled exception on {}", pathOf(request), ex);
		return respond(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR,
				ErrorCode.INTERNAL_ERROR.defaultMessage(), List.of(), request);
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<FieldErrorDetail> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
			.map(error -> new FieldErrorDetail(error.getField(), error.getDefaultMessage()))
			.toList();
		return respondValidationError(fieldErrors, request);
	}

	@Override
	protected ResponseEntity<Object> handleHandlerMethodValidationException(HandlerMethodValidationException ex,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		List<FieldErrorDetail> fieldErrors = ex.getParameterValidationResults().stream()
			.flatMap(result -> result.getResolvableErrors().stream()
				.map(error -> new FieldErrorDetail(result.getMethodParameter().getParameterName(),
						error.getDefaultMessage())))
			.toList();
		return respondValidationError(fieldErrors, request);
	}

	/**
	 * Single exit point for the exceptions handled by the parent class, so they
	 * share the error format of the handlers above. The framework's own message
	 * is not forwarded because it can expose internal type names.
	 */
	@Override
	protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
			HttpStatusCode statusCode, WebRequest request) {
		if (statusCode.is5xxServerError()) {
			log.error("Request to {} failed with {}", pathOf(request), statusCode.value(), ex);
		}
		ErrorCode code = ErrorCode.fromStatus(statusCode);
		ApiErrorResponse error = ApiErrorResponse.of(statusCode, code, code.defaultMessage(), pathOf(request));
		return ResponseEntity.status(statusCode).headers(headers).body(error);
	}

	private ResponseEntity<Object> respondValidationError(List<FieldErrorDetail> fieldErrors, WebRequest request) {
		return respond(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR,
				ErrorCode.VALIDATION_ERROR.defaultMessage(), fieldErrors, request);
	}

	private ResponseEntity<Object> respond(HttpStatus status, ErrorCode code, String message,
			List<FieldErrorDetail> fieldErrors, WebRequest request) {
		return ResponseEntity.status(status)
			.body(ApiErrorResponse.of(status, code, message, pathOf(request), fieldErrors));
	}

	private static String pathOf(WebRequest request) {
		return request instanceof ServletWebRequest servletRequest ? servletRequest.getRequest().getRequestURI()
				: "";
	}

}
