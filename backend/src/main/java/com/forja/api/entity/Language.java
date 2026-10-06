package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "languages")
public class Language extends BaseEntity {

	@Column(nullable = false, unique = true, length = 40)
	private String slug;

	@Column(nullable = false, length = 80)
	private String name;

	@Column(length = 20)
	private String version;

	@Column(length = 40)
	private String icon;

	@Column(nullable = false, length = 200)
	private String tagline;

	@Column(columnDefinition = "text")
	private String description;

	@Column(nullable = false)
	private boolean active;

	@Column(name = "display_order", nullable = false)
	private int displayOrder;

	protected Language() {
	}

	public Language(String slug, String name, String version, String icon, String tagline, String description,
			boolean active, int displayOrder) {
		this.slug = slug;
		this.name = name;
		this.version = version;
		this.icon = icon;
		this.tagline = tagline;
		this.description = description;
		this.active = active;
		this.displayOrder = displayOrder;
	}

	public String getSlug() {
		return slug;
	}

	public String getName() {
		return name;
	}

	public String getVersion() {
		return version;
	}

	public String getIcon() {
		return icon;
	}

	public String getTagline() {
		return tagline;
	}

	public String getDescription() {
		return description;
	}

	public boolean isActive() {
		return active;
	}

	public int getDisplayOrder() {
		return displayOrder;
	}

}
