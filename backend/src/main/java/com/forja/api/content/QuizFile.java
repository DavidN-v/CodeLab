package com.forja.api.content;

import java.util.List;

/** Contents of a lesson's {@code <slug>.quiz.yml}. See docs/CONTENT.md. */
record QuizFile(List<Entry> questions) {

	/**
	 * @param type choice or output
	 * @param answer choice: index of the right option; output: the exact text printed
	 * @param input output only: stdin for the program
	 */
	record Entry(String type, String prompt, String code, List<String> options, Object answer, String explanation,
			String input) {
	}

}
