package com.forja.api.service;

import com.forja.api.dto.ExecutionRequest;
import com.forja.api.dto.ExecutionResponse;

public interface PlaygroundService {

	/**
	 * Runs a program once with the given stdin.
	 * @throws com.forja.api.exception.TooManyRequestsException over the per-learner limit
	 * @throws com.forja.api.exception.ExecutionUnavailableException if the runner cannot take it
	 */
	ExecutionResponse run(Long userId, ExecutionRequest request);

}
