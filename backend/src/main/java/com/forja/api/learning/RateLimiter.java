package com.forja.api.learning;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sliding-window limit per key, kept in memory. Enough for a single API
 * instance; several instances would need a shared store.
 */
public class RateLimiter {

	private final int maxEvents;

	private final Duration window;

	private final Clock clock;

	private final Map<Long, Deque<Instant>> events = new ConcurrentHashMap<>();

	public RateLimiter(int maxEvents, Duration window, Clock clock) {
		this.maxEvents = maxEvents;
		this.window = window;
		this.clock = clock;
	}

	/** Records an event for the key if it is under the limit. */
	public boolean tryAcquire(Long key) {
		Instant now = clock.instant();
		Instant windowStart = now.minus(window);
		Deque<Instant> recent = events.computeIfAbsent(key, ignored -> new ArrayDeque<>());
		synchronized (recent) {
			while (!recent.isEmpty() && recent.peekFirst().isBefore(windowStart)) {
				recent.pollFirst();
			}
			if (recent.size() >= maxEvents) {
				return false;
			}
			recent.addLast(now);
			return true;
		}
	}

}
