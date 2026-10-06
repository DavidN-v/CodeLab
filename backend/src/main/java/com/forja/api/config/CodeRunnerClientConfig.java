package com.forja.api.config;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(CodeRunnerProperties.class)
public class CodeRunnerClientConfig {

	/** A health probe must answer quickly even while the runner is busy executing code. */
	private static final Duration HEALTH_READ_TIMEOUT = Duration.ofSeconds(3);

	@Bean
	RestClient codeRunnerRestClient(CodeRunnerProperties properties) {
		return restClient(properties, properties.readTimeout());
	}

	@Bean
	RestClient codeRunnerHealthRestClient(CodeRunnerProperties properties) {
		return restClient(properties, HEALTH_READ_TIMEOUT);
	}

	private static RestClient restClient(CodeRunnerProperties properties, Duration readTimeout) {
		HttpClient httpClient = HttpClient.newBuilder()
			.version(HttpClient.Version.HTTP_1_1)
			.connectTimeout(properties.connectTimeout())
			.build();
		JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
		requestFactory.setReadTimeout(readTimeout);
		return RestClient.builder().baseUrl(properties.baseUrl().toString()).requestFactory(requestFactory).build();
	}

}
