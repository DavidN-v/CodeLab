package com.forja.api.tutor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.forja.api.exception.TutorUnavailableException;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** The tutor against a fake Anthropic API: what it sends, and what it makes of each answer. */
class ClaudeTutorModelTest {

	private static final String MESSAGE = """
			{"id":"msg_1","type":"message","role":"assistant","model":"claude-opus-5-5",
			 "content":[{"type":"text","text":"Una variable es una caja."}],
			 "stop_reason":"end_turn","stop_sequence":null,
			 "usage":{"input_tokens":10,"output_tokens":5}}""";

	private record Reply(int status, String body) {
	}

	private final Deque<Reply> replies = new ArrayDeque<>();

	private final List<String> requests = new ArrayList<>();

	private HttpServer server;

	private ClaudeTutorModel model;

	@BeforeEach
	void start() throws IOException {
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/", exchange -> {
			requests.add(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8)
					+ "\nbeta: " + exchange.getRequestHeaders().getFirst("anthropic-beta"));
			Reply reply = replies.isEmpty() ? new Reply(500, "{}") : replies.poll();
			byte[] body = reply.body().getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/json");
			exchange.sendResponseHeaders(reply.status(), body.length);
			exchange.getResponseBody().write(body);
			exchange.close();
		});
		server.start();
		model = new ClaudeTutorModel(new TutorProperties("sk-test", "claude-opus-5-5", "low", Duration.ofSeconds(10),
				"http://127.0.0.1:" + server.getAddress().getPort()));
	}

	@AfterEach
	void stop() {
		server.stop(0);
	}

	@Test
	void asksWithServerSideFallbacksAndReturnsTheText() {
		replies.add(new Reply(200, MESSAGE));

		assertThat(model.answer("Eres un tutor.", "¿Qué es una variable?")).isEqualTo("Una variable es una caja.");
		assertThat(requests.get(0)).contains("\"model\":\"claude-opus-5-5\"", "\"fallbacks\":\"default\"",
				"\"effort\":\"low\"", "beta: server-side-fallback-2026-07-01");
	}

	@Test
	void retriesWithoutFallbacksWhenTheAccountRejectsThem() {
		replies.add(new Reply(400, error("invalid_request_error", "fallbacks: not available for this account")));
		replies.add(new Reply(200, MESSAGE));

		assertThat(model.answer("s", "p")).isEqualTo("Una variable es una caja.");
		assertThat(requests.get(1)).doesNotContain("fallbacks");
	}

	@Test
	void anInvalidKeyIsExplainedInPlainWords() {
		replies.add(new Reply(401, error("authentication_error", "invalid x-api-key")));

		assertThatThrownBy(() -> model.answer("s", "p")).isInstanceOfSatisfying(TutorUnavailableException.class,
				ex -> assertThat(ex.userMessage()).contains("ANTHROPIC_API_KEY no es válida"));
	}

	@Test
	void anEmptyBalanceIsExplainedInPlainWords() {
		replies.add(new Reply(400,
				error("invalid_request_error", "Your credit balance is too low to access the Anthropic API.")));

		assertThatThrownBy(() -> model.answer("s", "p")).isInstanceOfSatisfying(TutorUnavailableException.class,
				ex -> assertThat(ex.userMessage()).contains("no tiene saldo"));
	}

	@Test
	void anUnknownModelSuggestsAnother() {
		replies.add(new Reply(404, error("not_found_error", "model: claude-opus-5-5")));

		assertThatThrownBy(() -> model.answer("s", "p")).isInstanceOfSatisfying(TutorUnavailableException.class,
				ex -> assertThat(ex.userMessage()).contains("TUTOR_MODEL"));
	}

	private static String error(String type, String message) {
		return "{\"type\":\"error\",\"error\":{\"type\":\"%s\",\"message\":\"%s\"}}".formatted(type, message);
	}

}
