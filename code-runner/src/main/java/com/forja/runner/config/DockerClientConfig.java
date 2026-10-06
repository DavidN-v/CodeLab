package com.forja.runner.config;

import java.net.http.HttpClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(RunnerProperties.class)
public class DockerClientConfig {

	@Bean
	HttpClient dockerHttpClient(RunnerProperties properties) {
		// HTTP/1.1: the Docker API (and the socket proxy in front of it) do not speak h2c.
		return HttpClient.newBuilder()
			.version(HttpClient.Version.HTTP_1_1)
			.connectTimeout(properties.docker().connectTimeout())
			.build();
	}

}
