package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** A word a course uses, explained in plain language. */
@Entity
@Table(name = "glossary_terms")
public class GlossaryTerm extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "course_id", nullable = false)
	private Course course;

	@Column(nullable = false, length = 80)
	private String term;

	/** JSON array of other spellings. */
	@Column(name = "aliases_json", nullable = false, columnDefinition = "text")
	private String aliasesJson;

	@Column(nullable = false, length = 600)
	private String definition;

	@Column(name = "display_order", nullable = false)
	private int displayOrder;

	protected GlossaryTerm() {
	}

	public GlossaryTerm(Course course, String term) {
		this.course = course;
		this.term = term;
	}

	public void update(String aliasesJson, String definition, int displayOrder) {
		this.aliasesJson = aliasesJson;
		this.definition = definition;
		this.displayOrder = displayOrder;
	}

	public String getTerm() {
		return term;
	}

	public String getAliasesJson() {
		return aliasesJson;
	}

	public String getDefinition() {
		return definition;
	}

	public int getDisplayOrder() {
		return displayOrder;
	}

}
