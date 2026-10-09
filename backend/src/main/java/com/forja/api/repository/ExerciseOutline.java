package com.forja.api.repository;

import com.forja.api.entity.Difficulty;
import com.forja.api.entity.ExerciseKind;

/** An exercise without its statement, code or tests: enough for listings and progress. */
public record ExerciseOutline(Long id, String slug, String title, String summary, Difficulty difficulty,
		ExerciseKind kind, int position, Long moduleId, String moduleSlug, String moduleTitle, int modulePosition) {
}
