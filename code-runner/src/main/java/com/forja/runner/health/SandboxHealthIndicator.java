package com.forja.runner.health;

import com.forja.runner.docker.DockerClient;
import com.forja.runner.docker.DockerException;
import com.forja.runner.execution.LanguageRuntime;
import com.forja.runner.execution.RuntimeRegistry;
import java.util.List;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

/** Reports under {@code /actuator/health} whether sandboxes can be created right now. */
@Component
public class SandboxHealthIndicator implements HealthIndicator {

	private final DockerClient dockerClient;

	private final RuntimeRegistry runtimeRegistry;

	public SandboxHealthIndicator(DockerClient dockerClient, RuntimeRegistry runtimeRegistry) {
		this.dockerClient = dockerClient;
		this.runtimeRegistry = runtimeRegistry;
	}

	@Override
	public Health health() {
		if (!dockerClient.ping()) {
			return Health.down().withDetail("docker", "unreachable").build();
		}
		try {
			List<String> missing = runtimeRegistry.all()
				.stream()
				.map(runtime -> runtime.properties().image())
				.filter(image -> !dockerClient.imageExists(image))
				.toList();
			return missing.isEmpty() ? Health.up().build() : Health.down().withDetail("missingImages", missing).build();
		}
		catch (DockerException ex) {
			return Health.down().withDetail("docker", "error").build();
		}
	}

}
