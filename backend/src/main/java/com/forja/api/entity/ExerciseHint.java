package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "exercise_hints")
public class ExerciseHint extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "exercise_id", nullable = false)
	private Exercise exercise;

	@Column(nullable = false)
	private int position;

	@Column(nullable = false, columnDefinition = "text")
	private String content;

	protected ExerciseHint() {
	}

	ExerciseHint(Exercise exercise, int position) {
		this.exercise = exercise;
		this.position = position;
	}

	void update(String content) {
		this.content = content;
	}

	public int getPosition() {
		return position;
	}

	public String getContent() {
		return content;
	}

}
