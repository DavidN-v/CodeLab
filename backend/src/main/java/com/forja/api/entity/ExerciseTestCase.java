package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "exercise_test_cases")
public class ExerciseTestCase extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "exercise_id", nullable = false)
	private Exercise exercise;

	@Column(nullable = false)
	private int position;

	@Column(nullable = false, columnDefinition = "text")
	private String stdin;

	@Column(name = "expected_stdout", nullable = false, columnDefinition = "text")
	private String expectedStdout;

	/** Shown to the learner as an example; the others are hidden. */
	@Column(nullable = false)
	private boolean sample;

	protected ExerciseTestCase() {
	}

	ExerciseTestCase(Exercise exercise, int position) {
		this.exercise = exercise;
		this.position = position;
	}

	void update(String stdin, String expectedStdout, boolean sample) {
		this.stdin = stdin;
		this.expectedStdout = expectedStdout;
		this.sample = sample;
	}

	public int getPosition() {
		return position;
	}

	public String getStdin() {
		return stdin;
	}

	public String getExpectedStdout() {
		return expectedStdout;
	}

	public boolean isSample() {
		return sample;
	}

}
