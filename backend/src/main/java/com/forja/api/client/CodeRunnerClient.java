package com.forja.api.client;

import com.forja.api.exception.ExecutionUnavailableException;
import com.forja.api.exception.InvalidRequestException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Only gateway from the API to the code-runner service. Untrusted code is never
 * compiled or executed in this process; it is always delegated through here.
 */
@Component
public class CodeRunnerClient {

	private static final Logger log = LoggerFactory.getLogger(CodeRunnerClient.class);

	private final RestClient restClient;

	private final RestClient healthRestClient;

	public CodeRunnerClient(@Qualifier("codeRunnerRestClient") RestClient restClient,
			@Qualifier("codeRunnerHealthRestClient") RestClient healthRestClient) {
		this.restClient = restClient;
		this.healthRestClient = healthRestClient;
	}

	public boolean isReachable() {
		try {
			healthRestClient.get().uri("/actuator/health").retrieve().toBodilessEntity();
			return true;
		}
		catch (RestClientException ex) {
			log.debug("Code runner health check failed: {}", ex.getMessage());
			return false;
		}
	}

	/**
	 * Compiles the program once and runs it once per input.
	 * @throws InvalidRequestException if the runner refuses the program (too large, unsupported language)
	 * @throws ExecutionUnavailableException if the runner is down, busy or failing
	 */
	public RunnerExecution.Result execute(String language, String sourceCode, List<String> inputs) {
		try {
			return restClient.post()
				.uri("/internal/executions")
				.contentType(MediaType.APPLICATION_JSON)
				.body(new RunnerExecution.Request(language, sourceCode, inputs))
				.retrieve()
				.body(RunnerExecution.Result.class);
		}
		catch (RestClientResponseException ex) {
			if (ex.getStatusCode().isSameCodeAs(HttpStatus.BAD_REQUEST)) {
				throw new InvalidRequestException("El programa no se puede ejecutar: " + runnerMessage(ex));
			}
			throw new ExecutionUnavailableException("Code runner answered " + ex.getStatusCode(), ex);
		}
		catch (RestClientException ex) {
			throw new ExecutionUnavailableException("Code runner unreachable", ex);
		}
	}

	/**
	 * Runs the program once under the tracer for the step-by-step visualizer.
	 * @throws InvalidRequestException if the runner refuses the program
	 * @throws ExecutionUnavailableException if the runner is down, busy or failing
	 */
	public RunnerExecution.TraceResult trace(String language, String sourceCode, String stdin) {
		try {
			return restClient.post()
				.uri("/internal/traces")
				.contentType(MediaType.APPLICATION_JSON)
				.body(new RunnerExecution.TraceRequest(language, sourceCode, stdin))
				.retrieve()
				.body(RunnerExecution.TraceResult.class);
		}
		catch (RestClientResponseException ex) {
			if (ex.getStatusCode().isSameCodeAs(HttpStatus.BAD_REQUEST)) {
				throw new InvalidRequestException("El programa no se puede visualizar: " + runnerMessage(ex));
			}
			throw new ExecutionUnavailableException("Code runner answered " + ex.getStatusCode(), ex);
		}
		catch (RestClientException ex) {
			throw new ExecutionUnavailableException("Code runner unreachable", ex);
		}
	}

	private static String runnerMessage(RestClientResponseException ex) {
		try {
			RunnerError error = ex.getResponseBodyAs(RunnerError.class);
			return error == null || error.message() == null ? "solicitud rechazada" : error.message();
		}
		catch (RuntimeException parseFailure) {
			return "solicitud rechazada";
		}
	}

	private record RunnerError(String error, String message) {
	}

}
