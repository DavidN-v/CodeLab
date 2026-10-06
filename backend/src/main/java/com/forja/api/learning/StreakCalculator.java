package com.forja.api.learning;

import java.time.LocalDate;
import java.util.Set;
import java.util.TreeSet;

/** Consecutive days of activity. A streak survives until the end of the day after the last activity. */
public final class StreakCalculator {

	public record Streak(int current, int longest, boolean activeToday) {
	}

	private StreakCalculator() {
	}

	public static Streak calculate(Set<LocalDate> activeDays, LocalDate today) {
		boolean activeToday = activeDays.contains(today);
		LocalDate cursor = activeToday ? today : today.minusDays(1);
		int current = 0;
		while (activeDays.contains(cursor)) {
			current++;
			cursor = cursor.minusDays(1);
		}

		int longest = 0;
		int run = 0;
		LocalDate previous = null;
		for (LocalDate day : new TreeSet<>(activeDays)) {
			run = previous != null && previous.plusDays(1).equals(day) ? run + 1 : 1;
			longest = Math.max(longest, run);
			previous = day;
		}
		return new Streak(current, longest, activeToday);
	}

}
