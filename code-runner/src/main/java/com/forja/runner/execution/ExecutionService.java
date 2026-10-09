package com.forja.runner.execution;

import com.forja.runner.config.RunnerProperties;
import com.forja.runner.config.SandboxLimits;
import com.forja.runner.config.TraceProperties;
import com.forja.runner.execution.ExecutionResult.RunResult;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Service;

/**
 * Validates a request against its runtime's limits and runs it once a sandbox
 * slot is free. The number of slots bounds how many containers run at once.
 */
@Service
public class ExecutionService {

	private final RuntimeRegistry runtimeRegistry;

	private final DockerSandbox sandbox;

	private final Semaphore slots;

	private final long queueTimeoutMs;

	public ExecutionService(RuntimeRegistry runtimeRegistry, DockerSandbox sandbox, RunnerProperties properties) {
		this.runtimeRegistry = runtimeRegistry;
		this.sandbox = sandbox;
		this.slots = new Semaphore(properties.maxConcurrentExecutions(), true);
		this.queueTimeoutMs = properties.queueTimeout().toMillis();
	}

	public ExecutionResult execute(ExecutionRequest request) {
		LanguageRuntime runtime = runtimeRegistry.find(request.language())
			.orElseThrow(() -> new ExecutionRejectedException(
					"Language '%s' is not supported by this runner".formatted(request.language())));
		checkLimits(request, runtime.limits());

		acquireSlot();
		try {
			return sandbox.execute(runtime, request.sourceCode(), request.inputs());
		}
		finally {
			slots.release();
		}
	}

	/** Runs the program once under the tracer, for the step-by-step visualizer. */
	public TraceResult trace(TraceRequest request) {
		LanguageRuntime runtime = runtimeRegistry.find(request.language())
			.orElseThrow(() -> new ExecutionRejectedException(
					"Language '%s' is not supported by this runner".formatted(request.language())));
		TraceProperties trace = runtime.properties().trace();
		if (trace == null) {
			throw new ExecutionRejectedException("Language '%s' cannot be traced".formatted(request.language()));
		}
		checkLimits(new ExecutionRequest(request.language(), request.sourceCode(), List.of(request.stdin())),
				runtime.limits());

		ExecutionResult result;
		acquireSlot();
		try {
			result = sandbox.execute(runtime, request.sourceCode(), List.of(request.stdin()),
					new DockerSandbox.RunPlan(trace.command(), trace.timeout(), trace.output()));
		}
		finally {
			slots.release();
		}
		if (result.status() == ExecutionStatus.COMPILATION_ERROR) {
			return new TraceResult(ExecutionStatus.COMPILATION_ERROR, result.compile(), null, null);
		}
		if (result.runs().isEmpty() || result.runs().get(0).timedOut()) {
			return new TraceResult(ExecutionStatus.TIMEOUT, result.compile(), null, "The tracer did not finish");
		}
		RunResult run = result.runs().get(0);
		String json = run.stdout().strip();
		if (run.stdoutTruncated() || !json.startsWith("{") || !json.endsWith("}")) {
			return new TraceResult(ExecutionStatus.TIMEOUT, result.compile(), null,
					"Unusable trace (exit %d): %s".formatted(run.exitCode(), run.stderr()));
		}
		return new TraceResult(ExecutionStatus.COMPLETED, result.compile(), json, null);
	}

	private static void checkLimits(ExecutionRequest request, SandboxLimits limits) {
		if (bytes(request.sourceCode()) > limits.maxSource().toBytes()) {
			throw new ExecutionRejectedException("Source code exceeds " + limits.maxSource().toKilobytes() + " KB");
		}
		if (request.inputs().size() > limits.maxRuns()) {
			throw new ExecutionRejectedException("At most " + limits.maxRuns() + " inputs per execution");
		}
		if (request.inputs().stream().anyMatch(input -> bytes(input) > limits.maxStdin().toBytes())) {
			throw new ExecutionRejectedException("Each input is limited to " + limits.maxStdin().toKilobytes() + " KB");
		}
		// Environment variables cannot carry NUL bytes, and that is how the sandbox receives the code.
		if (request.sourceCode().indexOf('\0') >= 0 || request.inputs().stream().anyMatch(i -> i.indexOf('\0') >= 0)) {
			throw new ExecutionRejectedException("Source code and inputs must not contain NUL characters");
		}
	}

	private void acquireSlot() {
		try {
			if (!slots.tryAcquire(queueTimeoutMs, TimeUnit.MILLISECONDS)) {
				throw new RunnerBusyException("Every sandbox is busy; try again shortly");
			}
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			throw new RunnerBusyException("Interrupted while waiting for a sandbox");
		}
	}

	private static long bytes(String value) {
		return value.getBytes(StandardCharsets.UTF_8).length;
	}

}
