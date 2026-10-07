package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import com.forja.api.learning.ReviewSchedule;
import java.time.Instant;

/** A learner's state on one exercise: attempts, help used and whether it is solved. */
@Entity
@Table(name = "exercise_progress")
public class ExerciseProgress extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "exercise_id", nullable = false)
	private Exercise exercise;

	@Column(nullable = false)
	private int attempts;

	@Column(name = "hints_revealed", nullable = false)
	private int hintsRevealed;

	@Column(name = "solution_viewed", nullable = false)
	private boolean solutionViewed;

	@Column(name = "solved_at")
	private Instant solvedAt;

	@Column(name = "xp_awarded", nullable = false)
	private int xpAwarded;

	/** Spaced reviews passed since it was solved. */
	@Column(name = "review_stage", nullable = false)
	private int reviewStage;

	/** When it should be practised again; null before solving and once learned. */
	@Column(name = "next_review_at")
	private Instant nextReviewAt;

	protected ExerciseProgress() {
	}

	public ExerciseProgress(User user, Exercise exercise) {
		this.user = user;
		this.exercise = exercise;
	}

	public void recordAttempt() {
		attempts++;
	}

	/** @return whether this was the first time the exercise was solved */
	public boolean markSolved(Instant at, int xp) {
		if (solvedAt != null) {
			return false;
		}
		solvedAt = at;
		xpAwarded = xp;
		nextReviewAt = ReviewSchedule.next(0, at);
		return true;
	}

	public boolean isReviewDue(Instant now) {
		return nextReviewAt != null && !nextReviewAt.isAfter(now);
	}

	/** @return whether this solve counted as a due review */
	public boolean passReview(Instant at) {
		if (!isReviewDue(at)) {
			return false;
		}
		reviewStage++;
		nextReviewAt = ReviewSchedule.next(reviewStage, at);
		return true;
	}

	public void revealHint(int available) {
		if (hintsRevealed < available) {
			hintsRevealed++;
		}
	}

	public void markSolutionViewed() {
		solutionViewed = true;
	}

	public Exercise getExercise() {
		return exercise;
	}

	public int getAttempts() {
		return attempts;
	}

	public int getHintsRevealed() {
		return hintsRevealed;
	}

	public boolean isSolutionViewed() {
		return solutionViewed;
	}

	public Instant getSolvedAt() {
		return solvedAt;
	}

	public boolean isSolved() {
		return solvedAt != null;
	}

	public int getXpAwarded() {
		return xpAwarded;
	}

	public int getReviewStage() {
		return reviewStage;
	}

	public Instant getNextReviewAt() {
		return nextReviewAt;
	}

}
