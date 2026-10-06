package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A unit of a course ("module" in the product). Named CourseModule to avoid
 * clashing with {@link java.lang.Module}.
 */
@Entity
@Table(name = "modules")
public class CourseModule extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "course_id", nullable = false)
	private Course course;

	@Column(nullable = false, length = 80)
	private String slug;

	@Column(nullable = false, length = 120)
	private String title;

	@Column(nullable = false, length = 300)
	private String summary;

	@Column(nullable = false)
	private boolean published;

	@Column(name = "display_order", nullable = false)
	private int displayOrder;

	protected CourseModule() {
	}

	public CourseModule(String slug, String title, String summary, boolean published, int displayOrder) {
		this.slug = slug;
		this.title = title;
		this.summary = summary;
		this.published = published;
		this.displayOrder = displayOrder;
	}

	void assignTo(Course owner) {
		this.course = owner;
	}

	public Course getCourse() {
		return course;
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

	public boolean isPublished() {
		return published;
	}

	public int getDisplayOrder() {
		return displayOrder;
	}

	/** Made visible once its content exists; see ContentImporter. */
	public void publish() {
		this.published = true;
	}

}
