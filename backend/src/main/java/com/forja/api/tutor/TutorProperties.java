package com.forja.api.tutor;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param apiKey Anthropic API key; the tutor is off when it is blank
 * @param model Claude model that answers
 * @param effort how much the model thinks: low, medium, high, xhigh or max
 * @param timeout longest wait for one answer
 */
@ConfigurationProperties("forja.tutor")
public record TutorProperties(String apiKey, String model, String effort, Duration timeout) {

	public boolean enabled() {
		return apiKey != null && !apiKey.isBlank();
	}

}
