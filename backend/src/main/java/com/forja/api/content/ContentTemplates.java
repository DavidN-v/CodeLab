package com.forja.api.content;

import java.util.ArrayList;
import java.util.List;

/**
 * How fill and parsons exercises turn the learner's answer into a program.
 * The importer uses it to check that the content is consistent; the exercise
 * service, to build the program it grades.
 */
public final class ContentTemplates {

	/** A blank in the starter of a fill exercise. */
	public static final String BLANK = "{{?}}";

	/** The line of a parsons starter where the ordered lines go. */
	public static final String LINES = "{{lines}}";

	private ContentTemplates() {
	}

	public static int countBlanks(String template) {
		int count = 0;
		for (int at = template.indexOf(BLANK); at >= 0; at = template.indexOf(BLANK, at + BLANK.length())) {
			count++;
		}
		return count;
	}

	/** Replaces each blank with its answer, in order. Missing answers leave the blank empty. */
	public static String fill(String template, List<String> answers) {
		StringBuilder program = new StringBuilder();
		int from = 0;
		int index = 0;
		for (int at = template.indexOf(BLANK); at >= 0; at = template.indexOf(BLANK, from)) {
			program.append(template, from, at);
			program.append(index < answers.size() ? answers.get(index) : "");
			index++;
			from = at + BLANK.length();
		}
		return program.append(template.substring(from)).toString();
	}

	public static int countLinesMarkers(String template) {
		return (int) template.lines().filter(line -> line.strip().equals(LINES)).count();
	}

	/** Puts the lines where the {@code {{lines}}} marker is. */
	public static String assemble(String template, List<String> lines) {
		List<String> program = new ArrayList<>();
		for (String line : template.split("\n", -1)) {
			if (line.strip().equals(LINES)) {
				program.addAll(lines);
			}
			else {
				program.add(line);
			}
		}
		return String.join("\n", program);
	}

}
