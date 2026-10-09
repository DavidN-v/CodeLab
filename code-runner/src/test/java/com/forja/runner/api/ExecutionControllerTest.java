package com.forja.runner.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.forja.runner.execution.ExecutionRejectedException;
import com.forja.runner.execution.ExecutionResult;
import com.forja.runner.execution.ExecutionResult.CompileResult;
import com.forja.runner.execution.ExecutionResult.RunResult;
import com.forja.runner.execution.ExecutionService;
import com.forja.runner.execution.ExecutionStatus;
import com.forja.runner.execution.RunnerBusyException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ExecutionController.class)
class ExecutionControllerTest {

	private static final String BODY = """
			{"language": "java", "sourceCode": "class A {}", "inputs": [""]}
			""";

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private ExecutionService executionService;

	@Test
	void returnsTheExecutionResult() throws Exception {
		when(executionService.execute(any())).thenReturn(new ExecutionResult(ExecutionStatus.COMPLETED,
				new CompileResult(true, "", false, 700), List.of(new RunResult(0, false, "hola\n", false, "", false, 80)),
				900));

		mockMvc.perform(post("/internal/executions").contentType(MediaType.APPLICATION_JSON).content(BODY))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("COMPLETED"))
			.andExpect(jsonPath("$.runs[0].stdout").value("hola\n"));
	}

	@Test
	void rejectsRequestsWithoutInputs() throws Exception {
		mockMvc.perform(post("/internal/executions").contentType(MediaType.APPLICATION_JSON)
			.content("{\"language\": \"java\", \"sourceCode\": \"x\", \"inputs\": []}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
	}

	@Test
	void mapsRejectionsAndBusyToStableCodes() throws Exception {
		when(executionService.execute(any())).thenThrow(new ExecutionRejectedException("demasiado grande"));
		mockMvc.perform(post("/internal/executions").contentType(MediaType.APPLICATION_JSON).content(BODY))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.message").value("demasiado grande"));

		doThrow(new RunnerBusyException("ocupado")).when(executionService).execute(any());
		mockMvc.perform(post("/internal/executions").contentType(MediaType.APPLICATION_JSON).content(BODY))
			.andExpect(status().isServiceUnavailable())
			.andExpect(jsonPath("$.error").value("RUNNER_BUSY"));
	}

}
