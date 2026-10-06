package com.forja.runner.api;

import com.forja.runner.execution.ExecutionRejectedException;
import com.forja.runner.execution.RunnerBusyException;
import com.forja.runner.execution.SandboxUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class RunnerExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(RunnerExceptionHandler.class);

	@ExceptionHandler({ ExecutionRejectedException.class })
	public ResponseEntity<RunnerErrorResponse> handleRejected(ExecutionRejectedException ex) {
		return respond(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", ex.getMessage());
	}

	@ExceptionHandler({ MethodArgumentNotValidException.class, HttpMessageNotReadableException.class })
	public ResponseEntity<RunnerErrorResponse> handleMalformed(Exception ex) {
		return respond(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "Malformed execution request");
	}

	@ExceptionHandler(RunnerBusyException.class)
	public ResponseEntity<RunnerErrorResponse> handleBusy(RunnerBusyException ex) {
		return respond(HttpStatus.SERVICE_UNAVAILABLE, "RUNNER_BUSY", ex.getMessage());
	}

	@ExceptionHandler(SandboxUnavailableException.class)
	public ResponseEntity<RunnerErrorResponse> handleUnavailable(SandboxUnavailableException ex) {
		log.error("{}", ex.getMessage(), ex);
		return respond(HttpStatus.SERVICE_UNAVAILABLE, "SANDBOX_UNAVAILABLE", ex.getMessage());
	}

	private static ResponseEntity<RunnerErrorResponse> respond(HttpStatus status, String code, String message) {
		return ResponseEntity.status(status).body(new RunnerErrorResponse(code, message));
	}

}
