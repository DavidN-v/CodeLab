package com.forja.api.repository;

/** A lesson without its body: enough for indexes, navigation and progress. */
public record LessonOutline(Long id, String slug, String title, String summary, int estimatedMinutes, int position,
		Long moduleId, String moduleSlug, String moduleTitle, int modulePosition) {
}
