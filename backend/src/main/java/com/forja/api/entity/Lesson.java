package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "lessons")
public class Lesson extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "module_id", nullable = false)
	private CourseModule module;

	@Column(nullable = false, length = 80)
	private String slug;

	@Column(nullable = false, length = 160)
	private String title;

	@Column(nullable = false, length = 300)
	private String summary;

	@Column(name = "content_markdown", nullable = false, columnDefinition = "text")
	private String contentMarkdown;

	@Column(name = "estimated_minutes", nullable = false)
	private int estimatedMinutes;

	@Column(nullable = false)
	private boolean published;

	@Column(name = "display_order", nullable = false)
	private int displayOrder;

	protected Lesson() {
	}

	public Lesson(CourseModule module, String slug) {
		this.module = module;
		this.slug = slug;
	}

	public void update(String title, String summary, String contentMarkdown, int estimatedMinutes, int displayOrder) {
		this.title = title;
		this.summary = summary;
		this.contentMarkdown = contentMarkdown;
		this.estimatedMinutes = estimatedMinutes;
		this.displayOrder = displayOrder;
		this.published = true;
	}

	/** Hidden instead of deleted, so progress that points at it survives. */
	public void unpublish() {
		this.published = false;
	}

	public CourseModule getModule() {
		return module;
	}

	public String getSlug() {
		return slug;
	}

	public String getTitle() {
		return title;
	}

	public String getSummary() {
		return summary;
	}

	public String getContentMarkdown() {
		return contentMarkdown;
	}

	public int getEstimatedMinutes() {
		return estimatedMinutes;
	}

	public boolean isPublished() {
		return published;
	}

	public int getDisplayOrder() {
		return displayOrder;
	}

}
