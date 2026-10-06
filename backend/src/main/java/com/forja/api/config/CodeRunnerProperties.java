package com.forja.api.config;

import java.net.URI;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param baseUrl where the code-runner service listens; only reachable over the
 * internal runner network
 * @param connectTimeout maximum time to establish the connection
 * @param readTimeout maximum time to wait for a response, which bounds how long
 * an execution can keep a request thread busy
 */
@ConfigurationProperties("forja.code-runner")
public record CodeRunnerProperties(URI baseUrl, Duration connectTimeout, Duration readTimeout) {
}
