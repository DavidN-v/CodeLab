package com.forja.api.learning;

/**
 * Decides whether a program's output matches the expected one. Learners should
 * fail on wrong answers, not on invisible differences, so line endings,
 * trailing spaces and trailing blank lines are ignored. Everything else,
 * including spaces inside a line and letter case, must match.
 */
public final class OutputComparator {

	private OutputComparator() {
	}

	public static boolean matches(String expected, String actual) {
		return normalize(expected).equals(normalize(actual));
	}

	static String normalize(String output) {
		if (output == null) {
			return "";
		}
		String[] lines = output.replace("\r\n", "\n").replace('\r', '\n').split("\n", -1);
		StringBuilder normalized = new StringBuilder();
		for (String line : lines) {
			normalized.append(line.stripTrailing()).append('\n');
		}
		int end = normalized.length();
		while (end > 0 && normalized.charAt(end - 1) == '\n') {
			end--;
		}
		return normalized.substring(0, end);
	}

}
