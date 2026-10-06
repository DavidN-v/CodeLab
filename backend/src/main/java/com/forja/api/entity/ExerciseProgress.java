package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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

}
