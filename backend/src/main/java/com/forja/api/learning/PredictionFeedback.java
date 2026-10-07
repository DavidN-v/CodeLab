package com.forja.api.learning;

import java.util.ArrayList;
import java.util.List;

/**
 * Explains how far a predicted output is from the real one without giving
 * the answer away: how many lines are right and where the first difference is.
 */
public final class PredictionFeedback {

	private PredictionFeedback() {
	}

	public static String describe(String expected, String predicted) {
		List<String> right = lines(expected);
		List<String> guess = lines(predicted);
		if (guess.isEmpty()) {
			return "Escribe lo que imprime el programa, una línea por cada println.";
		}
		int matching = 0;
		int firstDifference = -1;
		for (int i = 0; i < Math.max(right.size(), guess.size()); i++) {
			boolean same = i < right.size() && i < guess.size() && right.get(i).equals(guess.get(i));
			if (same) {
				matching++;
			}
			else if (firstDifference < 0) {
				firstDifference = i + 1;
			}
		}
		StringBuilder feedback = new StringBuilder();
		feedback.append("Aciertas %d de %d %s.".formatted(matching, right.size(), right.size() == 1 ? "línea" : "líneas"));
		if (guess.size() != right.size()) {
			feedback.append(" El programa imprime %d %s y tu respuesta tiene %d.".formatted(right.size(),
					right.size() == 1 ? "línea" : "líneas", guess.size()));
		}
		if (firstDifference > 0) {
			feedback.append(" Revisa la línea %d.".formatted(firstDifference));
		}
		return feedback.toString();
	}

	private static List<String> lines(String output) {
		String normalized = OutputComparator.normalize(output);
		return normalized.isEmpty() ? new ArrayList<>() : List.of(normalized.split("\n", -1));
	}

}
