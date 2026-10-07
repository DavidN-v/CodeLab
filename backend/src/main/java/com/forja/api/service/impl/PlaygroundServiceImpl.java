package com.forja.api.service.impl;

import com.forja.api.client.CodeRunnerClient;
import com.forja.api.client.RunnerExecution;
import com.forja.api.dto.ExecutionOutcome;
import com.forja.api.dto.ExecutionRequest;
import com.forja.api.dto.ExecutionResponse;
import com.forja.api.dto.TraceResponse;
import com.forja.api.dto.TraceResponse.TraceOutcome;
import com.forja.api.exception.InvalidRequestException;
import com.forja.api.exception.TooManyRequestsException;
import com.forja.api.learning.RateLimiter;
import com.forja.api.repository.LanguageRepository;
import com.forja.api.service.PlaygroundService;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class PlaygroundServiceImpl implements PlaygroundService {

	private final CodeRunnerClient codeRunnerClient;

	private final LanguageRepository languageRepository;

	private final RateLimiter rateLimiter;

	public PlaygroundServiceImpl(CodeRunnerClient codeRunnerClient, LanguageRepository languageRepository,
			@Qualifier("executionRateLimiter") RateLimiter rateLimiter) {
		this.codeRunnerClient = codeRunnerClient;
		this.languageRepository = languageRepository;
		this.rateLimiter = rateLimiter;
	}

	@Override
	public ExecutionResponse run(Long userId, ExecutionRequest request) {
		admit(userId, request);
		RunnerExecution.Result result = codeRunnerClient.execute(request.languageSlug(), request.sourceCode(),
				List.of(request.stdin()));
		return toResponse(result);
	}

	@Override
	public TraceResponse trace(Long userId, ExecutionRequest request) {
		admit(userId, request);
		RunnerExecution.TraceResult result = codeRunnerClient.trace(request.languageSlug(), request.sourceCode(),
				request.stdin());
		String compileOutput = result.compile() == null ? "" : result.compile().output();
		if ("COMPILATION_ERROR".equals(result.status())) {
			return new TraceResponse(TraceOutcome.COMPILATION_ERROR, compileOutput, null);
		}
		if (result.trace() == null || !"COMPLETED".equals(result.status())) {
			return new TraceResponse(TraceOutcome.TOO_LONG, compileOutput, null);
		}
		return new TraceResponse(TraceOutcome.TRACED, compileOutput, result.trace());
	}

	private void admit(Long userId, ExecutionRequest request) {
		boolean available = languageRepository.findBySlug(request.languageSlug())
			.map(language -> language.isActive())
			.orElse(false);
		if (!available) {
			throw new InvalidRequestException("Todavía no se puede ejecutar código en '%s'.".formatted(request.languageSlug()));
		}
		if (!rateLimiter.tryAcquire(userId)) {
			throw new TooManyRequestsException("Has ejecutado mucho código en poco tiempo. Espera un minuto.");
		}
	}

	static ExecutionResponse toResponse(RunnerExecution.Result result) {
		String compileOutput = result.compile() == null ? "" : result.compile().output();
		if (!result.compiled()) {
			ExecutionOutcome outcome = "TIMEOUT".equals(result.status()) ? ExecutionOutcome.TIMEOUT
					: ExecutionOutcome.COMPILATION_ERROR;
			return new ExecutionResponse(outcome, compileOutput, "", "", null, 0, false);
		}
		if (result.runs() == null || result.runs().isEmpty()) {
			return new ExecutionResponse(ExecutionOutcome.TIMEOUT, compileOutput, "", "", null, 0, false);
		}
		RunnerExecution.Run run = result.runs().get(0);
		ExecutionOutcome outcome = run.timedOut() ? ExecutionOutcome.TIMEOUT
				: run.exitCode() == 0 ? ExecutionOutcome.SUCCESS : ExecutionOutcome.RUNTIME_ERROR;
		return new ExecutionResponse(outcome, compileOutput, run.stdout(), run.stderr(), run.exitCode(),
				run.durationMs(), run.stdoutTruncated() || run.stderrTruncated());
	}

}
