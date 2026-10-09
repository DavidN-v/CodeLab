package com.forja.api.content;

import com.forja.api.entity.Difficulty;
import java.util.List;

/**
 * Contents of an exercise's {@code <slug>.yml}. See docs/CONTENT.md.
 *
 * @param kind code (default), fix, fill, parsons, predict or project
 * @param answers fill only: the answer of each {@code {{?}}} blank, in order
 * @param lines parsons only: the lines that replace {@code {{lines}}}, in order
 * @param distractors parsons only: lines that do not belong to the program
 */
record ExerciseFile(String title, String summary, Difficulty difficulty, String kind, String statement,
		String starter, String solution, List<String> hints, List<TestEntry> tests, List<String> answers,
		List<String> lines, List<String> distractors) {

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
