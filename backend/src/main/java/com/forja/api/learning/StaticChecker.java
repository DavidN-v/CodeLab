package com.forja.api.learning;

import com.forja.api.content.ContentTemplates;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Grades fill and parsons exercises without running anything, for technologies
 * the sandbox cannot run (Angular, for instance): the answer is compared with
 * the solution, ignoring spacing and the kind of quotes.
 */
public final class StaticChecker {

	/** Whether the answer is right and, if not, what to look at. */
	public record Verdict(boolean right, String feedback) {
	}

	private StaticChecker() {
	}

	/** Compares each blank with the text the solution has in its place. */
	public static Verdict checkBlanks(String starter, String solution, List<String> parts) {
		List<String> expected = expectedBlanks(starter, solution);
		List<Integer> wrong = new ArrayList<>();
		for (int i = 0; i < expected.size(); i++) {
			String given = i < parts.size() ? parts.get(i) : "";
			if (!normalize(given).equals(normalize(expected.get(i)))) {
				wrong.add(i + 1);
			}
		}
		if (wrong.isEmpty()) {
			return new Verdict(true, null);
		}
		String which = wrong.stream().map(String::valueOf).collect(Collectors.joining(", "));
		return new Verdict(false, wrong.size() == 1 ? "Revisa el hueco " + which + "."
				: "Revisa los huecos " + which + ".");
	}

	/** Compares the learner's lines, in order, with the right ones. */
	public static Verdict checkLines(List<String> expected, List<String> given) {
		for (int i = 0; i < Math.min(expected.size(), given.size()); i++) {
			if (!normalize(given.get(i)).equals(normalize(expected.get(i)))) {
				return new Verdict(false, "La línea " + (i + 1) + " no va ahí (o sobra).");
			}
		}
		if (given.size() < expected.size()) {
			return new Verdict(false, "Faltan líneas: el programa completo tiene " + expected.size() + ".");
		}
		if (given.size() > expected.size()) {
			return new Verdict(false, "Sobran líneas: el programa completo tiene " + expected.size() + ".");
		}
		return new Verdict(true, null);
	}

	/** The text that goes in each blank, read from the solution around the starter's fixed parts. */
	static List<String> expectedBlanks(String starter, String solution) {
		String[] fixed = starter.split(Pattern.quote(ContentTemplates.BLANK), -1);
		StringBuilder regex = new StringBuilder();
		for (int i = 0; i < fixed.length; i++) {
			regex.append(Pattern.quote(fixed[i]));
			if (i < fixed.length - 1) {
				regex.append("(.*?)");
			}
		}
		Matcher matcher = Pattern.compile(regex.toString(), Pattern.DOTALL).matcher(solution);
		if (!matcher.matches()) {
			throw new IllegalStateException("The solution does not fit the starter's blanks");
		}
		List<String> blanks = new ArrayList<>();
		for (int i = 1; i <= matcher.groupCount(); i++) {
			blanks.add(matcher.group(i));
		}
		return blanks;
	}

	/**
	 * Spacing and the choice of quotes do not change the meaning of an answer:
	 * {@code {{titulo()}}} is {@code {{ titulo() }}}. Spaces between words still count.
	 */
	static String normalize(String text) {
		return text.strip()
			.replace('"', '\'')
			.replace('`', '\'')
			.replaceAll("\\s+", " ")
			.replaceAll(" ?([^\\w\\s]) ?", "$1");
	}

}
