package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "submissions")
public class Submission extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "exercise_id", nullable = false)
	private Exercise exercise;

	@Column(name = "source_code", nullable = false, columnDefinition = "text")
	private String sourceCode;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private SubmissionStatus status;

	@Column(name = "passed_tests", nullable = false)
	private int passedTests;

	@Column(name = "total_tests", nullable = false)
	private int totalTests;

	@Column(name = "execution_time_ms")
	private Integer executionTimeMs;

	protected Submission() {
	}

	public Submission(User user, Exercise exercise, String sourceCode, SubmissionStatus status, int passedTests,
			int totalTests, Integer executionTimeMs) {
		this.user = user;
		this.exercise = exercise;
		this.sourceCode = sourceCode;
		this.status = status;
		this.passedTests = passedTests;
		this.totalTests = totalTests;
		this.executionTimeMs = executionTimeMs;
	}

	public Exercise getExercise() {
		return exercise;
	}

	public String getSourceCode() {
		return sourceCode;
	}

	public SubmissionStatus getStatus() {
		return status;
	}

	public int getPassedTests() {
		return passedTests;
	}

	public int getTotalTests() {
		return totalTests;
	}

	public Integer getExecutionTimeMs() {
		return executionTimeMs;
	}

}
