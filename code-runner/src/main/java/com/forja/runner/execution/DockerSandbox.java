package com.forja.runner.execution;

import com.forja.runner.config.SandboxLimits;
import com.forja.runner.docker.ContainerSpec;
import com.forja.runner.docker.DockerClient;
import com.forja.runner.docker.DockerException;
import com.forja.runner.execution.ExecutionResult.CompileResult;
import com.forja.runner.execution.ExecutionResult.RunResult;
import com.forja.runner.execution.HarnessOutput.Run;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;

/**
 * Runs one execution in a throwaway container: create, start, wait, collect
 * the harness output, and always remove the container afterwards.
 */
@Component
public class DockerSandbox {

	private static final Logger log = LoggerFactory.getLogger(DockerSandbox.class);

	/** Container start-up and JVM boot on top of the compile and run limits. */
	private static final Duration OVERHEAD = Duration.ofSeconds(10);

	/** How close to the limit a killed run must be to count as a timeout rather than a crash. */
	private static final long TIMEOUT_TOLERANCE_MS = 250;

	private static final int KILLED_EXIT_CODE = 137;

	private final DockerClient dockerClient;

	private final String harnessScript;

	public DockerSandbox(DockerClient dockerClient) {
		this.dockerClient = dockerClient;
		this.harnessScript = loadHarness();
	}

	/** How the program is run: normally, or under the tracer. */
	public record RunPlan(String command, Duration runTimeout, DataSize output) {

		static RunPlan normal(LanguageRuntime runtime) {
			return new RunPlan(runtime.properties().runCommand(), runtime.limits().runTimeout(),
					runtime.limits().output());
		}

	}

	public ExecutionResult execute(LanguageRuntime runtime, String sourceCode, List<String> inputs) {
		return execute(runtime, sourceCode, inputs, RunPlan.normal(runtime));
	}

	public ExecutionResult execute(LanguageRuntime runtime, String sourceCode, List<String> inputs, RunPlan plan) {
		SandboxLimits limits = runtime.limits();
		SourceFile sourceFile = runtime.layout().resolve(sourceCode);
		long startedAt = System.nanoTime();

		String containerId;
		try {
			containerId = dockerClient.createContainer(containerSpec(runtime, sourceFile, sourceCode, inputs, plan));
		}
		catch (DockerException ex) {
			throw new SandboxUnavailableException("Could not create the sandbox", ex);
		}

		try {
			dockerClient.start(containerId);
			Duration budget = limits.compileTimeout().plus(plan.runTimeout().multipliedBy(inputs.size())).plus(OVERHEAD);
			Optional<Integer> exitCode = dockerClient.waitForExit(containerId, budget);
			if (exitCode.isEmpty()) {
				dockerClient.kill(containerId);
			}
			HarnessOutput output = HarnessOutputParser.parse(dockerClient.stdout(containerId));
			long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
			return interpret(output, exitCode.isEmpty(), plan.runTimeout(), durationMs);
		}
		catch (DockerException ex) {
			throw new SandboxUnavailableException("The sandbox failed while running", ex);
		}
		finally {
			removeQuietly(containerId);
		}
	}

	private ContainerSpec containerSpec(LanguageRuntime runtime, SourceFile sourceFile, String sourceCode,
			List<String> inputs, RunPlan plan) {
		SandboxLimits limits = runtime.limits();
		List<String> env = new ArrayList<>();
		env.add("FORJA_SOURCE=" + sourceCode);
		env.add("FORJA_SOURCE_FILE=" + sourceFile.fileName());
		env.add("FORJA_MAIN=" + sourceFile.entryPoint());
		env.add("FORJA_COMPILE_COMMAND=" + nullToEmpty(runtime.properties().compileCommand()));
		env.add("FORJA_RUN_COMMAND=" + plan.command());
		env.add("FORJA_COMPILE_TIMEOUT=" + Math.max(1, limits.compileTimeout().toSeconds()));
		env.add("FORJA_RUN_TIMEOUT=" + Math.max(1, plan.runTimeout().toSeconds()));
		env.add("FORJA_OUTPUT_LIMIT=" + plan.output().toBytes());
		env.add("FORJA_RUNS=" + inputs.size());
		for (int i = 0; i < inputs.size(); i++) {
			env.add("FORJA_STDIN_" + i + "=" + inputs.get(i));
		}

		String tmpfsOptions = "rw,noexec,nosuid,nodev,mode=1777,size=" + limits.workspace().toBytes();
		return new ContainerSpec(runtime.properties().image(), List.of("sh", "-c", harnessScript), env,
				limits.memory().toBytes(), Math.round(limits.cpus() * 1_000_000_000L), limits.pids(),
				Map.of("/sandbox", tmpfsOptions, "/tmp", tmpfsOptions));
	}

	private static ExecutionResult interpret(HarnessOutput output, boolean killed, Duration runTimeout,
			long durationMs) {
		if (output.compile() == null) {
			// Killed (or crashed) before the compiler finished.
			CompileResult compile = new CompileResult(false, "", false, durationMs);
			return new ExecutionResult(killed ? ExecutionStatus.TIMEOUT : ExecutionStatus.COMPILATION_ERROR,
					compile, List.of(), durationMs);
		}

		boolean compiled = output.compile().exitCode() == 0;
		CompileResult compile = new CompileResult(compiled, output.compileOutput().text(),
				output.compileOutput().truncated(), output.compile().millis());
		if (!compiled) {
			return new ExecutionResult(ExecutionStatus.COMPILATION_ERROR, compile, List.of(), durationMs);
		}

		long runTimeoutMs = runTimeout.toMillis();
		List<RunResult> runs = output.runs()
			.stream()
			.map(run -> toRunResult(run, runTimeoutMs))
			.toList();
		ExecutionStatus status = killed || !output.complete() ? ExecutionStatus.TIMEOUT : ExecutionStatus.COMPLETED;
		return new ExecutionResult(status, compile, runs, durationMs);
	}

	private static RunResult toRunResult(Run run, long runTimeoutMs) {
		boolean timedOut = run.exitCode() == KILLED_EXIT_CODE && run.millis() >= runTimeoutMs - TIMEOUT_TOLERANCE_MS;
		return new RunResult(run.exitCode(), timedOut, run.stdout().text(), run.stdout().truncated(),
				run.stderr().text(), run.stderr().truncated(), run.millis());
	}

	private void removeQuietly(String containerId) {
		try {
			dockerClient.remove(containerId);
		}
		catch (DockerException ex) {
			// The janitor removes it on the next start-up.
			log.warn("Could not remove sandbox container {}: {}", containerId, ex.getMessage());
		}
	}

	private static String nullToEmpty(String value) {
		return value == null ? "" : value;
	}

	private static String loadHarness() {
		try (InputStream input = new ClassPathResource("sandbox/harness.sh").getInputStream()) {
			// A checkout with CRLF line endings (Windows) would break the shell script.
			return new String(input.readAllBytes(), StandardCharsets.UTF_8).replace("\r", "");
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Missing sandbox/harness.sh on the classpath", ex);
		}
	}

}
