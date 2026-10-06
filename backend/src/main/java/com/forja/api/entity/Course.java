package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "courses")
public class Course extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "language_id", nullable = false)
	private Language language;

	@Column(nullable = false, unique = true, length = 80)
	private String slug;

	@Column(nullable = false, length = 120)
	private String title;

	@Column(nullable = false, length = 300)
	private String summary;

	@Column(columnDefinition = "text")
	private String description;

	@Column(nullable = false)
	private boolean published;

	@Column(name = "display_order", nullable = false)
	private int displayOrder;

	@OneToMany(mappedBy = "course")
	@OrderBy("displayOrder ASC")
	private List<CourseModule> modules = new ArrayList<>();

	protected Course() {
	}

	public Course(Language language, String slug, String title, String summary, String description,
			boolean published, int displayOrder) {
		this.language = language;
		this.slug = slug;
		this.title = title;
		this.summary = summary;
		this.description = description;
		this.published = published;
		this.displayOrder = displayOrder;
	}

	public void addModule(CourseModule module) {
		modules.add(module);
		module.assignTo(this);
	}

	public Language getLanguage() {
		return language;
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

	public String getDescription() {
		return description;
	}

	public boolean isPublished() {
		return published;
	}

	public int getDisplayOrder() {
		return displayOrder;
	}

	public List<CourseModule> getModules() {
		return Collections.unmodifiableList(modules);
	}

}
