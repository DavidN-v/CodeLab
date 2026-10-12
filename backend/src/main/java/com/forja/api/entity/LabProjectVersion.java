package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** A save point of a lab project that the learner can restore. */
@Entity
@Table(name = "lab_project_versions")
public class LabProjectVersion extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "project_id", nullable = false)
	private LabProject project;

	@Column(nullable = false, length = 120)
	private String label;

	@Column(nullable = false, columnDefinition = "text")
	private String content;

	protected LabProjectVersion() {
	}

	public LabProjectVersion(LabProject project, String label, String content) {
		this.project = project;
		this.label = label;
		this.content = content;
	}

	public String getLabel() {
		return label;
	}

	public String getContent() {
		return content;
	}

}
