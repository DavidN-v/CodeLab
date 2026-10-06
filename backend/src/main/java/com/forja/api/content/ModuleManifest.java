package com.forja.api.content;

import java.util.List;

/**
 * Contents of a module's {@code module.yml}: its lessons in reading order and
 * the slugs of its exercises in practice order.
 */
record ModuleManifest(List<LessonEntry> lessons, List<String> exercises) {

	/** Lesson metadata; the body lives next to the manifest in {@code <slug>.md}. */
	record LessonEntry(String slug, String title, String summary, int minutes) {
	}

}
