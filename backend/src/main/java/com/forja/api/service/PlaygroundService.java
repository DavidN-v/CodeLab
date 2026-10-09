package com.forja.api.service;

import com.forja.api.dto.ExecutionRequest;
import com.forja.api.dto.ExecutionResponse;
import com.forja.api.dto.TraceResponse;

public interface PlaygroundService {

	/**
	 * Runs a program once with the given stdin.
	 * @throws com.forja.api.exception.TooManyRequestsException over the per-learner limit
	 * @throws com.forja.api.exception.ExecutionUnavailableException if the runner cannot take it
	 */
	ExecutionResponse run(Long userId, ExecutionRequest request);

	/**
	 * Runs a program once step by step, for the visualizer. Counts against the
	 * same limit as running.
	 */
	TraceResponse trace(Long userId, ExecutionRequest request);

}
