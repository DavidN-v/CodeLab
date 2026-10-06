package com.forja.api.client;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

/** Reports the code runner under {@code /actuator/health} as the "codeRunner" component. */
@Component
public class CodeRunnerHealthIndicator implements HealthIndicator {

	private final CodeRunnerClient codeRunnerClient;

	public CodeRunnerHealthIndicator(CodeRunnerClient codeRunnerClient) {
		this.codeRunnerClient = codeRunnerClient;
	}

	@Override
	public Health health() {
		return codeRunnerClient.isReachable() ? Health.up().build() : Health.down().build();
	}

}
