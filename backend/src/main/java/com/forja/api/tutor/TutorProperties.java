package com.forja.api.tutor;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param apiKey Anthropic API key; the tutor is off when it is blank
 * @param model Claude model that answers
 * @param effort how much the model thinks: low, medium, high, xhigh or max
 * @param timeout longest wait for one answer
 * @param baseUrl API endpoint; null for Anthropic's (tests point it elsewhere)
 * @param workspaceId Anthropic workspace to bill; only keys not scoped to a workspace need it
 */
@ConfigurationProperties("forja.tutor")
public record TutorProperties(String apiKey, String model, String effort, Duration timeout, String baseUrl,
		String workspaceId) {

	/** A key pasted into a Windows .env often brings quotes, spaces or a carriage return with it. */
	public TutorProperties {
		apiKey = clean(apiKey);
		model = clean(model);
		workspaceId = clean(workspaceId);
	}

	private static String clean(String value) {
		if (value == null) {
			return null;
		}
		return value.strip().replaceAll("^[\"']+|[\"']+$", "").strip();
	}

	public boolean enabled() {
		return apiKey != null && !apiKey.isBlank();
	}

}
