package com.forja.api.tutor;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param apiKey Anthropic API key; the tutor is off when it is blank
 * @param model Claude model that answers
 * @param effort how much the model thinks: low, medium, high, xhigh or max
 * @param timeout longest wait for one answer
 * @param baseUrl API endpoint; null for Anthropic's (tests point it elsewhere)
 */
@ConfigurationProperties("forja.tutor")
public record TutorProperties(String apiKey, String model, String effort, Duration timeout, String baseUrl) {

	public boolean enabled() {
		return apiKey != null && !apiKey.isBlank();
	}

}
