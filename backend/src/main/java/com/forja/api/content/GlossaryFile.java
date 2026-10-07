package com.forja.api.content;

import java.util.List;

/** Contents of a course's {@code glossary.yml}. */
record GlossaryFile(List<Entry> terms) {

	record Entry(String term, List<String> aliases, String definition) {
	}

}
