package com.forja.api.util;

/**
 * Format shared by every slug in the catalog. Mirrors the CHECK constraints in
 * the database schema.
 */
public final class SlugRules {

	public static final String PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";

	public static final String MESSAGE = "debe contener solo minúsculas, números y guiones";

	private SlugRules() {
	}

}
