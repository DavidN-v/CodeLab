package com.forja.api.learning;

import com.forja.api.client.RunnerExecution;
import com.forja.api.dto.TestOutcome;
import com.forja.api.dto.TestResultResponse;
import com.forja.api.entity.SubmissionStatus;
import java.util.ArrayList;
import java.util.List;

/**
 * Turns the runs of a submission into a verdict. Expected outputs never leave
 * the API: the runner only sees inputs, and only sample cases are echoed back
 * to the learner in full.
 */
public final class Grader {

	/** A test case as the grader needs it. */
	public record TestCase(int position, String stdin, String expectedStdout, boolean sample) {
	}

	public record Grade(SubmissionStatus status, int passed, int total, Integer slowestRunMs, String compileOutput,
			List<TestResultResponse> tests) {
	}

	private Grader() {
	}

	public static Grade grade(List<TestCase> cases, RunnerExecution.Result result) {
		if (!result.compiled()) {
			String output = result.compile() == null ? "" : result.compile().output();
			List<TestResultResponse> tests = cases.stream()
				.map(testCase -> result(testCase, TestOutcome.NOT_RUN, null))
				.toList();
			return new Grade(SubmissionStatus.COMPILATION_ERROR, 0, cases.size(), null, output, tests);
		}

		List<TestResultResponse> tests = new ArrayList<>();
		SubmissionStatus firstFailure = null;
		int passed = 0;
		Integer slowest = null;
		List<RunnerExecution.Run> runs = result.runs() == null ? List.of() : result.runs();
		for (int i = 0; i < cases.size(); i++) {
			TestCase testCase = cases.get(i);
			RunnerExecution.Run run = i < runs.size() ? runs.get(i) : null;
			TestOutcome outcome = outcomeOf(testCase, run);
			if (run != null) {
				slowest = slowest == null ? (int) run.durationMs() : Math.max(slowest, (int) run.durationMs());
			}
			if (outcome == TestOutcome.PASSED) {
				passed++;
			}
			else if (firstFailure == null) {
				firstFailure = statusOf(outcome);
			}
			tests.add(result(testCase, outcome, run));
		}
		SubmissionStatus status = firstFailure == null ? SubmissionStatus.ACCEPTED : firstFailure;
		return new Grade(status, passed, cases.size(), slowest, null, tests);
	}

	private static TestOutcome outcomeOf(TestCase testCase, RunnerExecution.Run run) {
		if (run == null) {
			return TestOutcome.NOT_RUN;
		}
		if (run.timedOut()) {
			return TestOutcome.TIMEOUT;
		}
		if (run.exitCode() != 0) {
			return TestOutcome.RUNTIME_ERROR;
		}
		return OutputComparator.matches(testCase.expectedStdout(), run.stdout()) ? TestOutcome.PASSED
				: TestOutcome.WRONG_OUTPUT;
	}

	private static SubmissionStatus statusOf(TestOutcome outcome) {
		return switch (outcome) {
			case TIMEOUT, NOT_RUN -> SubmissionStatus.TIME_LIMIT_EXCEEDED;
			case RUNTIME_ERROR -> SubmissionStatus.RUNTIME_ERROR;
			default -> SubmissionStatus.WRONG_ANSWER;
		};
	}

	private static TestResultResponse result(TestCase testCase, TestOutcome outcome, RunnerExecution.Run run) {
		if (!testCase.sample()) {
			return new TestResultResponse(testCase.position(), false, outcome, null, null, null, null);
		}
		return new TestResultResponse(testCase.position(), true, outcome, testCase.stdin(), testCase.expectedStdout(),
				run == null ? null : run.stdout(), run == null ? null : run.stderr());
	}

}
