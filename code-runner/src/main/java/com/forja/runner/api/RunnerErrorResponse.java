package com.forja.runner.api;

/**
 * Error body of the runner's API. Only the backend reads it.
 *
 * @param error stable code: INVALID_REQUEST, RUNNER_BUSY or SANDBOX_UNAVAILABLE
 */
public record RunnerErrorResponse(String error, String message) {
}
