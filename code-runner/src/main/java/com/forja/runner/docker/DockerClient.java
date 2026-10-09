package com.forja.runner.docker;

import com.forja.runner.config.RunnerProperties;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Minimal client for the endpoints of the Docker Engine API the sandbox needs:
 * create, start, wait, kill, read logs and remove containers, and inspect
 * images. It talks plain HTTP to the socket proxy; the runner never mounts the
 * Docker socket itself.
 */
@Component
public class DockerClient {

	/** Label put on every sandbox container, used to find leftovers after a crash. */
	public static final String SANDBOX_LABEL = "forja.sandbox";

	private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(30);

	private final HttpClient httpClient;

	private final ObjectMapper objectMapper;

	private final URI baseUrl;

	public DockerClient(HttpClient dockerHttpClient, ObjectMapper objectMapper, RunnerProperties properties) {
		this.httpClient = dockerHttpClient;
		this.objectMapper = objectMapper;
		this.baseUrl = properties.docker().url();
	}

	public boolean ping() {
		try {
			return send(get("/_ping"), BodyHandlers.discarding()).statusCode() == 200;
		}
		catch (DockerException ex) {
			return false;
		}
	}

	public boolean imageExists(String image) {
		int status = send(get("/images/" + image + "/json"), BodyHandlers.discarding()).statusCode();
		if (status == 404) {
			return false;
		}
		expectSuccess(status, "inspect image " + image);
		return true;
	}

	/** Creates a locked-down container and returns its id. */
	public String createContainer(ContainerSpec spec) {
		Map<String, Object> hostConfig = new LinkedHashMap<>();
		hostConfig.put("NetworkMode", "none");
		hostConfig.put("ReadonlyRootfs", true);
		hostConfig.put("CapDrop", List.of("ALL"));
		hostConfig.put("SecurityOpt", List.of("no-new-privileges"));
		hostConfig.put("Privileged", false);
		hostConfig.put("Memory", spec.memoryBytes());
		hostConfig.put("MemorySwap", spec.memoryBytes());
		hostConfig.put("NanoCpus", spec.nanoCpus());
		hostConfig.put("PidsLimit", spec.pidsLimit());
		hostConfig.put("Tmpfs", spec.tmpfs());
		hostConfig.put("Ulimits", List.of(Map.of("Name", "nofile", "Soft", 1024, "Hard", 1024)));
		// Bounded logs: the harness output is already capped, this caps anything else.
		hostConfig.put("LogConfig", Map.of("Type", "json-file", "Config", Map.of("max-size", "8m", "max-file", "1")));

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("Image", spec.image());
		body.put("Cmd", spec.command());
		body.put("Env", spec.env());
		body.put("User", "65534:65534");
		body.put("WorkingDir", "/sandbox");
		body.put("NetworkDisabled", true);
		body.put("Labels", Map.of(SANDBOX_LABEL, "true"));
		body.put("HostConfig", hostConfig);

		HttpResponse<String> response = send(post("/containers/create", objectMapper.writeValueAsString(body)),
				BodyHandlers.ofString());
		expectSuccess(response.statusCode(), "create container: " + response.body());
		return objectMapper.readTree(response.body()).get("Id").asString();
	}

	public void start(String containerId) {
		int status = send(post("/containers/" + containerId + "/start", ""), BodyHandlers.discarding()).statusCode();
		expectSuccess(status, "start container");
	}

	/**
	 * Blocks until the container stops or the timeout elapses.
	 * @return the exit code, or empty if the container was still running
	 */
	public Optional<Integer> waitForExit(String containerId, Duration timeout) {
		// Docker sends the response headers straight away and the body only when the
		// container stops, so the request timeout cannot bound this wait.
		CompletableFuture<HttpResponse<String>> pending = httpClient.sendAsync(
				post("/containers/" + containerId + "/wait?condition=not-running", ""), BodyHandlers.ofString());
		try {
			HttpResponse<String> response = pending.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
			expectSuccess(response.statusCode(), "wait for container");
			JsonNode statusCode = objectMapper.readTree(response.body()).get("StatusCode");
			return Optional.of(statusCode == null ? -1 : statusCode.asInt());
		}
		catch (TimeoutException ex) {
			pending.cancel(true);
			return Optional.empty();
		}
		catch (ExecutionException ex) {
			throw new DockerException("Docker API request failed: wait for container", ex.getCause());
		}
		catch (InterruptedException ex) {
			pending.cancel(true);
			Thread.currentThread().interrupt();
			throw new DockerException("Interrupted while waiting for container", ex);
		}
	}

	public void kill(String containerId) {
		int status = send(post("/containers/" + containerId + "/kill", ""), BodyHandlers.discarding()).statusCode();
		// 409: it already stopped on its own between the wait and the kill.
		if (status != 409) {
			expectSuccess(status, "kill container");
		}
	}

	/** Everything the container wrote to stdout. */
	public byte[] stdout(String containerId) {
		HttpResponse<byte[]> response = send(get("/containers/" + containerId + "/logs?stdout=true&stderr=false"),
				BodyHandlers.ofByteArray());
		expectSuccess(response.statusCode(), "read container logs");
		return DockerLogs.stdout(response.body());
	}

	public void remove(String containerId) {
		int status = send(delete("/containers/" + containerId + "?force=true&v=true"), BodyHandlers.discarding())
			.statusCode();
		if (status != 404) {
			expectSuccess(status, "remove container");
		}
	}

	/** Ids of every sandbox container, running or not. */
	public List<String> sandboxContainerIds() {
		String filters = URLEncoder.encode("{\"label\":[\"" + SANDBOX_LABEL + "\"]}", StandardCharsets.UTF_8);
		HttpResponse<String> response = send(get("/containers/json?all=true&filters=" + filters),
				BodyHandlers.ofString());
		expectSuccess(response.statusCode(), "list containers");
		return objectMapper.readTree(response.body()).valueStream().map(node -> node.get("Id").asString()).toList();
	}

	private HttpRequest get(String path) {
		return request(path).GET().build();
	}

	private HttpRequest post(String path, String json) {
		return request(path).header("Content-Type", "application/json").POST(BodyPublishers.ofString(json)).build();
	}

	private HttpRequest delete(String path) {
		return request(path).DELETE().build();
	}

	private HttpRequest.Builder request(String path) {
		return HttpRequest.newBuilder(baseUrl.resolve(path)).timeout(REQUEST_TIMEOUT);
	}

	private <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> bodyHandler) {
		try {
			return httpClient.send(request, bodyHandler);
		}
		catch (IOException ex) {
			throw new DockerException("Docker API unreachable at " + baseUrl, ex);
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			throw new DockerException("Interrupted while calling the Docker API", ex);
		}
	}

	private static void expectSuccess(int status, String action) {
		if (status < 200 || status >= 300) {
			throw new DockerException("Docker API request failed (%d): %s".formatted(status, action));
		}
	}

}
