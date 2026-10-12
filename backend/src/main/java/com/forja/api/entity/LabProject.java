package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** A project a learner builds in the lab (Práctica general). */
@Entity
@Table(name = "lab_projects")
public class LabProject extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, length = 500)
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private LabMode mode;

	/** JSON owned by the frontend: idea, files, tests and plan. */
	@Column(nullable = false, columnDefinition = "text")
	private String content;

	/** The learner's own grouping of projects; empty when it is in none. */
	@Column(nullable = false, length = 60)
	private String folder = "";

	protected LabProject() {
	}

	public LabProject(User user, String name, String description, LabMode mode, String content) {
		this.user = user;
		update(name, description, mode, content);
	}

	public void update(String name, String description, LabMode mode, String content) {
		this.name = name;
		this.description = description;
		this.mode = mode;
		this.content = content;
	}

	public void moveTo(String folder) {
		this.folder = folder;
	}

	public void restore(String content) {
		this.content = content;
	}

	public String getName() {
		return name;
	}

	public String getDescription() {
		return description;
	}

	public LabMode getMode() {
		return mode;
	}

	public String getFolder() {
		return folder;
	}

	public String getContent() {
		return content;
	}

}
