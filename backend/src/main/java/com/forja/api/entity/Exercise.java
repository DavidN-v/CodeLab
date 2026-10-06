package com.forja.api.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.BiConsumer;
import java.util.function.BiFunction;

@Entity
@Table(name = "exercises")
public class Exercise extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "module_id", nullable = false)
	private CourseModule module;

	@Column(nullable = false, unique = true, length = 80)
	private String slug;

	@Column(nullable = false, length = 160)
	private String title;

	@Column(nullable = false, length = 300)
	private String summary;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private Difficulty difficulty;

	@Column(name = "statement_markdown", nullable = false, columnDefinition = "text")
	private String statementMarkdown;

	@Column(name = "starter_code", nullable = false, columnDefinition = "text")
	private String starterCode;

	@Column(name = "solution_code", nullable = false, columnDefinition = "text")
	private String solutionCode;

	@Column(nullable = false)
	private boolean published;

	@Column(name = "display_order", nullable = false)
	private int displayOrder;

	@OneToMany(mappedBy = "exercise", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("position ASC")
	private List<ExerciseTestCase> testCases = new ArrayList<>();

	@OneToMany(mappedBy = "exercise", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("position ASC")
	private List<ExerciseHint> hints = new ArrayList<>();

	protected Exercise() {
	}

	public Exercise(CourseModule module, String slug) {
		this.module = module;
		this.slug = slug;
	}

	public void update(CourseModule module, String title, String summary, Difficulty difficulty,
			String statementMarkdown, String starterCode, String solutionCode, int displayOrder) {
		this.module = module;
		this.title = title;
		this.summary = summary;
		this.difficulty = difficulty;
		this.statementMarkdown = statementMarkdown;
		this.starterCode = starterCode;
		this.solutionCode = solutionCode;
		this.displayOrder = displayOrder;
		this.published = true;
	}

	public void unpublish() {
		this.published = false;
	}

	public void replaceTestCases(List<TestCaseData> cases) {
		sync(testCases, cases, ExerciseTestCase::new,
				(testCase, data) -> testCase.update(data.stdin(), data.expectedStdout(), data.sample()));
	}

	public void replaceHints(List<String> contents) {
		sync(hints, contents, ExerciseHint::new, ExerciseHint::update);
	}

	/**
	 * Updates rows in place by position instead of deleting and re-inserting
	 * them: Hibernate flushes inserts before deletes, which would trip the
	 * unique (exercise, position) constraint.
	 */
	private <E, D> void sync(List<E> current, List<D> wanted, BiFunction<Exercise, Integer, E> create,
			BiConsumer<E, D> update) {
		while (current.size() > wanted.size()) {
			current.remove(current.size() - 1);
		}
		for (int i = 0; i < wanted.size(); i++) {
			if (i == current.size()) {
				current.add(create.apply(this, i + 1));
			}
			update.accept(current.get(i), wanted.get(i));
		}
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

	public Difficulty getDifficulty() {
		return difficulty;
	}

	public String getStatementMarkdown() {
		return statementMarkdown;
	}

	public String getStarterCode() {
		return starterCode;
	}

	public String getSolutionCode() {
		return solutionCode;
	}

	public boolean isPublished() {
		return published;
	}

	public int getDisplayOrder() {
		return displayOrder;
	}

	public List<ExerciseTestCase> getTestCases() {
		return Collections.unmodifiableList(testCases);
	}

	public List<ExerciseHint> getHints() {
		return Collections.unmodifiableList(hints);
	}

	public record TestCaseData(String stdin, String expectedStdout, boolean sample) {
	}

}
