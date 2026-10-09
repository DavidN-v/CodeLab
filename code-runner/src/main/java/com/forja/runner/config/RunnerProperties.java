package com.forja.runner.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.time.Duration;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * @param docker how to reach the Docker Engine API that creates the sandboxes
 * @param maxConcurrentExecutions sandboxes allowed to run at the same time; the
 * rest wait in line
 * @param queueTimeout how long a request may wait for a free slot before the
 * runner answers that it is busy
 * @param runtimes one entry per language, keyed by the language slug
 */
@Validated
@ConfigurationProperties("forja.runner")
public record RunnerProperties(@Valid @NotNull DockerProperties docker, @Min(1) int maxConcurrentExecutions,
		@NotNull Duration queueTimeout, @Valid @NotEmpty Map<String, RuntimeProperties> runtimes) {

	/**
	 * @param url Docker Engine API endpoint, normally the socket proxy
	 * @param connectTimeout maximum time to open a connection to it
	 */
	public record DockerProperties(@NotNull URI url, @NotNull Duration connectTimeout) {
	}

}
