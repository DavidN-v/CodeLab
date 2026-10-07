package com.forja.api.learning;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Spaced review. A solved exercise comes back after a day; each review passed
 * pushes the next one further away, and after the last one it stays learned.
 */
public final class ReviewSchedule {

	private static final List<Duration> INTERVALS = List.of(Duration.ofDays(1), Duration.ofDays(3), Duration.ofDays(7),
			Duration.ofDays(21), Duration.ofDays(60));

	private ReviewSchedule() {
	}

	/**
	 * @param reviewsPassed reviews passed so far; 0 right after solving
	 * @return when it is due next, or null when no more reviews are needed
	 */
	public static Instant next(int reviewsPassed, Instant from) {
		return reviewsPassed < INTERVALS.size() ? from.plus(INTERVALS.get(reviewsPassed)) : null;
	}

}
