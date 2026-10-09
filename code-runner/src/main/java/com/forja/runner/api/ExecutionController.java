package com.forja.runner.api;

import com.forja.runner.execution.ExecutionRequest;
import com.forja.runner.execution.ExecutionResult;
import com.forja.runner.execution.ExecutionService;
import com.forja.runner.execution.TraceRequest;
import com.forja.runner.execution.TraceResult;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Internal API, reachable only from the backend over the runner network. It
 * trusts its caller for authentication and rate limiting, not for limits.
 */
@RestController
@RequestMapping("/internal")
public class ExecutionController {

	private final ExecutionService executionService;

	public ExecutionController(ExecutionService executionService) {
		this.executionService = executionService;
	}

	@PostMapping("/executions")
	public ExecutionResult execute(@Valid @RequestBody ExecutionRequest request) {
		return executionService.execute(request);
	}

	@PostMapping("/traces")
	public TraceResult trace(@Valid @RequestBody TraceRequest request) {
		return executionService.trace(request);
	}

}
