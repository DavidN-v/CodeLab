package com.forja.api.config;

import com.forja.api.learning.RateLimiter;
import java.time.Clock;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Per-learner limits on the endpoints that start a sandbox. Generous for a
 * person practising, low enough that a script cannot monopolise the runner.
 */
@Configuration
public class RateLimitConfig {

	@Bean
	RateLimiter executionRateLimiter(Clock clock) {
		return new RateLimiter(30, Duration.ofMinutes(1), clock);
	}

	@Bean
	RateLimiter submissionRateLimiter(Clock clock) {
		return new RateLimiter(20, Duration.ofMinutes(1), clock);
	}

	/** Each tutor answer is a paid model call: a few per minute is plenty for a learner. */
	@Bean
	RateLimiter tutorRateLimiter(Clock clock) {
		return new RateLimiter(6, Duration.ofMinutes(1), clock);
	}

}
