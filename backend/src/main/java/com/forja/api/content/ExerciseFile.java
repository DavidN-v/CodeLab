package com.forja.api.content;

import com.forja.api.entity.Difficulty;
import java.util.List;

/** Contents of an exercise's {@code <slug>.yml}. */
record ExerciseFile(String title, String summary, Difficulty difficulty, String statement, String starter,
		String solution, List<String> hints, List<TestEntry> tests) {

	/**
	 * @param input stdin for the program; may be omitted
	 * @param output exact stdout expected, compared ignoring trailing whitespace
	 * @param sample whether the learner sees this case; hidden when omitted
	 */
	record TestEntry(String input, String output, Boolean sample) {

		boolean isSample() {
			return Boolean.TRUE.equals(sample);
		}

	}

}
