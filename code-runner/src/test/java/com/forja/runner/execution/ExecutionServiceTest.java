package com.forja.runner.execution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.forja.runner.config.RunnerProperties;
import com.forja.runner.config.RunnerProperties.DockerProperties;
import com.forja.runner.config.RuntimeProperties;
import com.forja.runner.config.SandboxLimits;
import com.forja.runner.config.TraceProperties;
import com.forja.runner.execution.ExecutionResult.CompileResult;
import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.util.unit.DataSize;

class ExecutionServiceTest {

	private static final SandboxLimits LIMITS = new SandboxLimits(Duration.ofSeconds(20), Duration.ofSeconds(5),
			DataSize.ofMegabytes(512), 1.0, 128, DataSize.ofKilobytes(64), 3, DataSize.ofBytes(100),
			DataSize.ofBytes(10), DataSize.ofMegabytes(32));

	private static final ExecutionResult OK = new ExecutionResult(ExecutionStatus.COMPLETED,
			new CompileResult(true, "", false, 1), List.of(), 1);

	private DockerSandbox sandbox;

	private ExecutionService service;

	@BeforeEach
	void setUp() {
		sandbox = mock(DockerSandbox.class);
		RunnerProperties properties = new RunnerProperties(
				new DockerProperties(URI.create("http://docker:2375"), Duration.ofSeconds(1)), 1,
				Duration.ofMillis(50),
				Map.of("java", new RuntimeProperties("img", "java", "javac", "java", LIMITS,
						new TraceProperties("trace", Duration.ofSeconds(10), DataSize.ofMegabytes(4)))));
		RuntimeRegistry registry = new RuntimeRegistry(properties, List.of(new JavaSourceLayout()));
		service = new ExecutionService(registry, sandbox, properties);
	}

	@Test
	void runsAValidRequestInTheSandbox() {
		when(sandbox.execute(any(), anyString(), anyList())).thenReturn(OK);

		assertThat(service.execute(new ExecutionRequest("java", "class A {}", List.of("1", "2")))).isEqualTo(OK);
	}

	@Test
	void rejectsUnknownLanguages() {
		assertThatThrownBy(() -> service.execute(new ExecutionRequest("cobol", "x", List.of(""))))
			.isInstanceOf(ExecutionRejectedException.class)
			.hasMessageContaining("cobol");
		verify(sandbox, never()).execute(any(), anyString(), anyList());
	}

	@Test
	void enforcesSizeLimitsBeforeCreatingASandbox() {
		assertThatThrownBy(() -> service.execute(new ExecutionRequest("java", "x".repeat(101), List.of(""))))
			.isInstanceOf(ExecutionRejectedException.class);
		assertThatThrownBy(() -> service.execute(new ExecutionRequest("java", "x", List.of("", "", "", ""))))
			.isInstanceOf(ExecutionRejectedException.class);
		assertThatThrownBy(() -> service.execute(new ExecutionRequest("java", "x", List.of("12345678901"))))
			.isInstanceOf(ExecutionRejectedException.class);
		assertThatThrownBy(() -> service.execute(new ExecutionRequest("java", "a\0b", List.of(""))))
			.isInstanceOf(ExecutionRejectedException.class);
		verify(sandbox, never()).execute(any(), anyString(), anyList());
	}

	@Test
	void answersBusyWhenEverySlotStaysTaken() throws Exception {
		CountDownLatch running = new CountDownLatch(1);
		CountDownLatch release = new CountDownLatch(1);
		when(sandbox.execute(any(), anyString(), anyList())).thenAnswer(invocation -> {
			running.countDown();
			release.await();
			return OK;
		});

		ExecutorService executor = Executors.newSingleThreadExecutor();
		try {
			executor.submit(() -> service.execute(new ExecutionRequest("java", "x", List.of(""))));
			running.await();

			assertThatThrownBy(() -> service.execute(new ExecutionRequest("java", "x", List.of(""))))
				.isInstanceOf(RunnerBusyException.class);
		}
		finally {
			release.countDown();
			executor.shutdown();
		}
	}

	@Test
	void aTraceIsPassedThroughAsJson() {
		when(sandbox.execute(any(), anyString(), anyList(), any())).thenReturn(new ExecutionResult(
				ExecutionStatus.COMPLETED, new CompileResult(true, "", false, 1),
				List.of(new ExecutionResult.RunResult(0, false, "{\"steps\":[]}\n", false, "", false, 5)), 1));

		TraceResult result = service.trace(new TraceRequest("java", "class A {}", ""));

		assertThat(result.status()).isEqualTo(ExecutionStatus.COMPLETED);
		assertThat(result.trace()).isEqualTo("{\"steps\":[]}");
	}

	@Test
	void aCutOffTraceIsNotPassedOn() {
		when(sandbox.execute(any(), anyString(), anyList(), any())).thenReturn(new ExecutionResult(
				ExecutionStatus.COMPLETED, new CompileResult(true, "", false, 1),
				List.of(new ExecutionResult.RunResult(0, false, "{\"steps\":[", true, "", false, 5)), 1));

		TraceResult result = service.trace(new TraceRequest("java", "class A {}", ""));

		assertThat(result.status()).isEqualTo(ExecutionStatus.TIMEOUT);
		assertThat(result.trace()).isNull();
	}

}
