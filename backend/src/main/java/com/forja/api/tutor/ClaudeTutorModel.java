package com.forja.api.tutor;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonValue;
import com.anthropic.errors.AnthropicIoException;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.models.beta.messages.BetaContentBlock;
import com.anthropic.models.beta.messages.BetaMessage;
import com.anthropic.models.beta.messages.BetaOutputConfig;
import com.anthropic.models.beta.messages.BetaStopReason;
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.forja.api.exception.TooManyRequestsException;
import com.forja.api.exception.TutorUnavailableException;
import java.util.Locale;
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
		this.client = AnthropicOkHttpClient.builder()
			.apiKey(properties.apiKey())
			.timeout(properties.timeout())
			.build();
	}

	@Override
	public String answer(String system, String prompt) {
		MessageCreateParams params = MessageCreateParams.builder()
			.model(properties.model())
			.maxTokens(MAX_TOKENS)
			.system(system)
			.addUserMessage(prompt)
			.outputConfig(BetaOutputConfig.builder()
				.effort(BetaOutputConfig.Effort.of(properties.effort().toLowerCase(Locale.ROOT)))
				.build())
			.addBeta(FALLBACK_BETA)
			.putAdditionalBodyProperty("fallbacks", JsonValue.from("default"))
			.build();
		BetaMessage response;
		try {
			response = client.beta().messages().create(params);
		}
		catch (RateLimitException ex) {
			throw new TooManyRequestsException("El tutor está muy ocupado ahora mismo. Prueba en un minuto.");
		}
		catch (AnthropicServiceException ex) {
			log.warn("Tutor request failed: {} {}", ex.statusCode(), ex.getMessage());
			throw new TutorUnavailableException("The tutor model answered " + ex.statusCode(), ex);
		}
		catch (AnthropicIoException ex) {
			throw new TutorUnavailableException("The tutor model is unreachable", ex);
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

}
