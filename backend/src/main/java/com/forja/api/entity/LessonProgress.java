package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

/** A lesson the learner marked as completed. */
@Entity
@Table(name = "lesson_progress")
public class LessonProgress extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "lesson_id", nullable = false)
	private Lesson lesson;

	@Column(name = "completed_at", nullable = false)
	private Instant completedAt;

	protected LessonProgress() {
	}

	public LessonProgress(User user, Lesson lesson, Instant completedAt) {
		this.user = user;
		this.lesson = lesson;
		this.completedAt = completedAt;
	}

	public Lesson getLesson() {
		return lesson;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

}
