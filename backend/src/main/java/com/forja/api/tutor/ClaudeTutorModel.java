package com.forja.api.tutor;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonValue;
import com.anthropic.errors.AnthropicIoException;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.BadRequestException;
import com.anthropic.errors.NotFoundException;
import com.anthropic.errors.PermissionDeniedException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.errors.UnauthorizedException;
import com.anthropic.models.beta.messages.BetaMessage;
import com.anthropic.models.beta.messages.BetaOutputConfig;
import com.anthropic.models.beta.messages.BetaStopReason;
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.forja.api.exception.TooManyRequestsException;
import com.forja.api.exception.TutorUnavailableException;
import java.util.Locale;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The tutor backed by Claude, through the official Java SDK. Refusals are
 * retried server-side on Anthropic's recommended fallback model.
 */
public class ClaudeTutorModel implements TutorModel {

	private static final Logger log = LoggerFactory.getLogger(ClaudeTutorModel.class);

	/** Tutor answers are short; this leaves room for the model's thinking as well. */
	private static final long MAX_TOKENS = 16_000;

	private static final String FALLBACK_BETA = "server-side-fallback-2026-07-01";

	private final AnthropicClient client;

	private final TutorProperties properties;

	public ClaudeTutorModel(TutorProperties properties) {
		this.properties = properties;
		AnthropicOkHttpClient.Builder builder = AnthropicOkHttpClient.builder()
			.apiKey(properties.apiKey())
			.timeout(properties.timeout())
			.maxRetries(1);
		if (properties.baseUrl() != null && !properties.baseUrl().isBlank()) {
			builder.baseUrl(properties.baseUrl());
		}
		this.client = builder.build();
	}

	@Override
	public String answer(String system, String prompt) {
		BetaMessage response;
		try {
			response = create(system, prompt, true);
		}
		catch (BadRequestException ex) {
			// An account without the fallback beta rejects it; the tutor still works without it.
			if (!String.valueOf(ex.getMessage()).contains("fallback")) {
				throw unavailable(ex);
			}
			log.info("Retrying the tutor request without server-side fallbacks: {}", ex.getMessage());
			response = call(() -> create(system, prompt, false));
		}
		catch (RuntimeException ex) {
			throw translate(ex);
		}
		if (response.stopReason().map(reason -> reason.equals(BetaStopReason.REFUSAL)).orElse(false)) {
			return null;
		}
		return response.content()
			.stream()
			.flatMap(block -> block.text().stream())
			.map(text -> text.text())
			.collect(Collectors.joining("\n\n"))
			.strip();
	}

	private BetaMessage create(String system, String prompt, boolean withFallbacks) {
		MessageCreateParams.Builder params = MessageCreateParams.builder()
			.model(properties.model())
			.maxTokens(MAX_TOKENS)
			.system(system)
			.addUserMessage(prompt)
			.outputConfig(BetaOutputConfig.builder()
				.effort(BetaOutputConfig.Effort.of(properties.effort().toLowerCase(Locale.ROOT)))
				.build());
		if (withFallbacks) {
			params.addBeta(FALLBACK_BETA).putAdditionalBodyProperty("fallbacks", JsonValue.from("default"));
		}
		return client.beta().messages().create(params.build());
	}

	private BetaMessage call(Supplier<BetaMessage> request) {
		try {
			return request.get();
		}
		catch (RuntimeException ex) {
			throw translate(ex);
		}
	}

	/** Turns an SDK failure into something the person running the server can act on. */
	private RuntimeException translate(RuntimeException ex) {
		if (ex instanceof RateLimitException) {
			return new TooManyRequestsException("El tutor está muy ocupado ahora mismo. Prueba en un minuto.");
		}
		if (ex instanceof AnthropicServiceException || ex instanceof AnthropicIoException) {
			return unavailable(ex);
		}
		// Anything else (a malformed key, an unexpected response) still deserves an answer the learner can read.
		return unavailable(ex);
	}

	private TutorUnavailableException unavailable(RuntimeException ex) {
		log.warn("Tutor request failed: {}", ex.getMessage(), ex);
		String message;
		if (ex instanceof UnauthorizedException) {
			message = "La clave ANTHROPIC_API_KEY no es válida. Revísala en el archivo .env (sin espacios ni "
					+ "comillas) y reinicia con docker compose up -d.";
		}
		else if (ex instanceof PermissionDeniedException) {
			message = "Tu clave no tiene permiso para usar el modelo %s.".formatted(properties.model());
		}
		else if (ex instanceof NotFoundException) {
			message = "El modelo %s no está disponible para tu cuenta. Prueba con TUTOR_MODEL=claude-sonnet-5-5 en el .env."
				.formatted(properties.model());
		}
		else if (ex instanceof AnthropicServiceException service && service.statusCode() == 402
				|| String.valueOf(ex.getMessage()).contains("credit balance")) {
			message = "Tu cuenta de Anthropic no tiene saldo. Añade créditos en console.anthropic.com.";
		}
		else if (ex instanceof AnthropicIoException) {
			message = "El servidor no puede conectar con la API de Anthropic. ¿Tiene acceso a internet?";
		}
		else if (ex instanceof AnthropicServiceException service && service.statusCode() >= 500) {
			message = "La API de Anthropic está saturada o caída. Prueba de nuevo en un momento.";
		}
		else {
			message = "El tutor no ha podido responder: " + ex.getMessage();
		}
		return new TutorUnavailableException("The tutor model failed: " + ex.getMessage(), message, ex);
	}

}
