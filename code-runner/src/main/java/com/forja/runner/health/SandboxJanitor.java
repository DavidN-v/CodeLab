package com.forja.runner.health;

import com.forja.runner.docker.DockerClient;
import com.forja.runner.docker.DockerException;
import com.forja.runner.execution.LanguageRuntime;
import com.forja.runner.execution.RuntimeRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * On start-up, removes sandbox containers left behind by a previous crash and
 * reports missing sandbox images. Never blocks start-up: Docker problems are
 * logged and surface in the health endpoint.
 */
@Component
public class SandboxJanitor {

	private static final Logger log = LoggerFactory.getLogger(SandboxJanitor.class);

	private final DockerClient dockerClient;

	private final RuntimeRegistry runtimeRegistry;

	public SandboxJanitor(DockerClient dockerClient, RuntimeRegistry runtimeRegistry) {
		this.dockerClient = dockerClient;
		this.runtimeRegistry = runtimeRegistry;
	}

	@EventListener(ApplicationReadyEvent.class)
	public void cleanUp() {
		try {
			for (String containerId : dockerClient.sandboxContainerIds()) {
				dockerClient.remove(containerId);
				log.info("Removed leftover sandbox container {}", containerId);
			}
			for (LanguageRuntime runtime : runtimeRegistry.all()) {
				if (!dockerClient.imageExists(runtime.properties().image())) {
					log.warn("Sandbox image {} for '{}' is missing; build it with `docker compose build`",
							runtime.properties().image(), runtime.language());
				}
			}
		}
		catch (DockerException ex) {
			log.warn("Docker API not available at start-up: {}", ex.getMessage());
		}
	}

}
