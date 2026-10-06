package com.forja.api.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Only gateway from the API to the code-runner service. Untrusted code is never
 * compiled or executed in this process; it is always delegated through here.
 */
@Component
public class CodeRunnerClient {

	private static final Logger log = LoggerFactory.getLogger(CodeRunnerClient.class);

	private final RestClient restClient;

	public CodeRunnerClient(@Qualifier("codeRunnerRestClient") RestClient restClient) {
		this.restClient = restClient;
	}

	public boolean isReachable() {
		try {
			restClient.get().uri("/actuator/health").retrieve().toBodilessEntity();
			return true;
		}
		catch (RestClientException ex) {
			log.debug("Code runner health check failed: {}", ex.getMessage());
			return false;
		}
	}

}
