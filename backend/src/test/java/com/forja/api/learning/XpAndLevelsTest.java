package com.forja.api.learning;

import static org.assertj.core.api.Assertions.assertThat;

import com.forja.api.entity.Difficulty;
import org.junit.jupiter.api.Test;

class XpAndLevelsTest {

	@Test
	void harderExercisesAreWorthMore() {
		assertThat(XpPolicy.exerciseXp(Difficulty.EASY, 0, false)).isEqualTo(20);
		assertThat(XpPolicy.exerciseXp(Difficulty.MEDIUM, 0, false)).isEqualTo(35);
		assertThat(XpPolicy.exerciseXp(Difficulty.HARD, 0, false)).isEqualTo(50);
	}

	@Test
	void hintsReduceTheRewardButNeverBelowTheMinimum() {
		assertThat(XpPolicy.exerciseXp(Difficulty.HARD, 2, false)).isEqualTo(40);
		assertThat(XpPolicy.exerciseXp(Difficulty.EASY, 10, false)).isEqualTo(5);
	}

	@Test
	void seeingTheSolutionFirstEarnsNothing() {
		assertThat(XpPolicy.exerciseXp(Difficulty.HARD, 0, true)).isZero();
	}

	@Test
	void levelsStartAtTheirThreshold() {
		assertThat(LevelTable.levelFor(0)).isEqualTo(new LevelTable.Level(1, "Aprendiz", 0, 100));
		assertThat(LevelTable.levelFor(99).number()).isEqualTo(1);
		assertThat(LevelTable.levelFor(100).number()).isEqualTo(2);
		assertThat(LevelTable.levelFor(1_000_000).nextLevelXp()).isNull();
	}

}
