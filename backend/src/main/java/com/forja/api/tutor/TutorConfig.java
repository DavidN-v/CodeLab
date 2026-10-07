package com.forja.api.tutor;

import com.forja.api.exception.TutorUnavailableException;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(TutorProperties.class)
public class TutorConfig {

	/** Claude when a key is configured; otherwise a tutor that is simply off. */
	@Bean
	TutorModel tutorModel(TutorProperties properties) {
		if (properties.enabled()) {
			return new ClaudeTutorModel(properties);
		}
		return (system, prompt) -> {
			throw new TutorUnavailableException("No ANTHROPIC_API_KEY configured");
		};
	}

}
