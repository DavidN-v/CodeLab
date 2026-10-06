package com.forja.api.learning;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.Test;

class StreakCalculatorTest {

	private static final LocalDate TODAY = LocalDate.of(2026, 10, 6);

	@Test
	void countsConsecutiveDaysEndingToday() {
		var streak = StreakCalculator.calculate(Set.of(TODAY, TODAY.minusDays(1), TODAY.minusDays(2)), TODAY);

		assertThat(streak).isEqualTo(new StreakCalculator.Streak(3, 3, true));
	}

	@Test
	void keepsTheStreakAliveUntilTheEndOfTheNextDay() {
		var streak = StreakCalculator.calculate(Set.of(TODAY.minusDays(1), TODAY.minusDays(2)), TODAY);

		assertThat(streak.current()).isEqualTo(2);
		assertThat(streak.activeToday()).isFalse();
	}

	@Test
	void breaksAfterAMissedDayButRemembersTheLongest() {
		var days = Set.of(TODAY.minusDays(2), TODAY.minusDays(10), TODAY.minusDays(11), TODAY.minusDays(12),
				TODAY.minusDays(13));

		var streak = StreakCalculator.calculate(days, TODAY);

		assertThat(streak.current()).isZero();
		assertThat(streak.longest()).isEqualTo(4);
	}

	@Test
	void noActivityMeansNoStreak() {
		assertThat(StreakCalculator.calculate(Set.of(), TODAY)).isEqualTo(new StreakCalculator.Streak(0, 0, false));
	}

}
