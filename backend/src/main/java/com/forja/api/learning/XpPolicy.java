package com.forja.api.learning;

import com.forja.api.entity.Difficulty;

/**
 * Experience points. Reading earns a little; solving earns more, and less the
 * more help was used. Looking at the solution before solving earns nothing.
 */
public final class XpPolicy {

	public static final int LESSON_XP = 10;

	private static final int HINT_PENALTY = 5;

	private static final int MINIMUM_EXERCISE_XP = 5;

	private XpPolicy() {
	}

	public static int baseXp(Difficulty difficulty) {
		return switch (difficulty) {
			case EASY -> 20;
			case MEDIUM -> 35;
			case HARD -> 50;
		};
	}

	public static int exerciseXp(Difficulty difficulty, int hintsRevealed, boolean solutionViewed) {
		if (solutionViewed) {
			return 0;
		}
		return Math.max(MINIMUM_EXERCISE_XP, baseXp(difficulty) - hintsRevealed * HINT_PENALTY);
	}

}
