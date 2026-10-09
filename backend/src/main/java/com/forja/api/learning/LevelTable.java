package com.forja.api.learning;

import java.util.List;

/** Levels and the experience at which each one starts. */
public final class LevelTable {

	public record Level(int number, String title, int minXp, Integer nextLevelXp) {
	}

	private record Threshold(String title, int minXp) {
	}

	private static final List<Threshold> THRESHOLDS = List.of(
			new Threshold("Aprendiz", 0),
			new Threshold("Iniciado", 100),
			new Threshold("Practicante", 250),
			new Threshold("Aprendiz de herrero", 500),
			new Threshold("Artesano", 850),
			new Threshold("Oficial", 1300),
			new Threshold("Forjador", 1900),
			new Threshold("Forjador experto", 2600),
			new Threshold("Maestro forjador", 3500));

	private LevelTable() {
	}

	public static Level levelFor(int xp) {
		int index = 0;
		while (index + 1 < THRESHOLDS.size() && xp >= THRESHOLDS.get(index + 1).minXp()) {
			index++;
		}
		Threshold current = THRESHOLDS.get(index);
		Integer next = index + 1 < THRESHOLDS.size() ? THRESHOLDS.get(index + 1).minXp() : null;
		return new Level(index + 1, current.title(), current.minXp(), next);
	}

}
