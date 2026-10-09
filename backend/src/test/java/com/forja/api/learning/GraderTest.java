package com.forja.api.learning;

import static org.assertj.core.api.Assertions.assertThat;

import com.forja.api.client.RunnerExecution;
import com.forja.api.dto.TestOutcome;
import com.forja.api.dto.TestResultResponse;
import com.forja.api.entity.SubmissionStatus;
import java.util.List;
import org.junit.jupiter.api.Test;

class GraderTest {

	private static final List<Grader.TestCase> CASES = List.of(new Grader.TestCase(1, "2 3", "5\n", true),
			new Grader.TestCase(2, "10 -4", "6\n", false), new Grader.TestCase(3, "0 0", "0\n", false));

	@Test
	void acceptsWhenEveryOutputMatches() {
		Grader.Grade grade = Grader.grade(CASES, completed(ok("5"), ok("6\n"), ok("0  \n")));

		assertThat(grade.status()).isEqualTo(SubmissionStatus.ACCEPTED);
		assertThat(grade.passed()).isEqualTo(3);
		assertThat(grade.slowestRunMs()).isEqualTo(30);
	}

	@Test
	void theFirstFailingCaseDecidesTheVerdict() {
		Grader.Grade grade = Grader.grade(CASES, completed(ok("5"), crashed(), ok("1")));

		assertThat(grade.status()).isEqualTo(SubmissionStatus.RUNTIME_ERROR);
		assertThat(grade.passed()).isEqualTo(1);
		assertThat(grade.tests()).extracting(TestResultResponse::outcome)
			.containsExactly(TestOutcome.PASSED, TestOutcome.RUNTIME_ERROR, TestOutcome.WRONG_OUTPUT);
	}

	@Test
	void runsSkippedAfterATimeoutCountAsNotRun() {
		RunnerExecution.Run timedOut = new RunnerExecution.Run(137, true, "", false, "", false, 5000);
		Grader.Grade grade = Grader.grade(CASES, completed(ok("5"), timedOut));

		assertThat(grade.status()).isEqualTo(SubmissionStatus.TIME_LIMIT_EXCEEDED);
		assertThat(grade.tests()).extracting(TestResultResponse::outcome)
			.containsExactly(TestOutcome.PASSED, TestOutcome.TIMEOUT, TestOutcome.NOT_RUN);
	}

	@Test
	void reportsCompilationErrorsWithTheCompilerOutput() {
		RunnerExecution.Result result = new RunnerExecution.Result("COMPILATION_ERROR",
				new RunnerExecution.Compile(false, "Main.java:1: error", false, 700), List.of(), 900);

		Grader.Grade grade = Grader.grade(CASES, result);

		assertThat(grade.status()).isEqualTo(SubmissionStatus.COMPILATION_ERROR);
		assertThat(grade.compileOutput()).isEqualTo("Main.java:1: error");
		assertThat(grade.passed()).isZero();
	}

	@Test
	void onlySampleCasesRevealTheirData() {
		Grader.Grade grade = Grader.grade(CASES, completed(ok("mal"), ok("mal"), ok("mal")));

		TestResultResponse sample = grade.tests().get(0);
		TestResultResponse hidden = grade.tests().get(1);
		assertThat(sample.input()).isEqualTo("2 3");
		assertThat(sample.expectedOutput()).isEqualTo("5\n");
		assertThat(sample.actualOutput()).isEqualTo("mal");
		assertThat(hidden.input()).isNull();
		assertThat(hidden.expectedOutput()).isNull();
		assertThat(hidden.actualOutput()).isNull();
	}

	private static RunnerExecution.Result completed(RunnerExecution.Run... runs) {
		return new RunnerExecution.Result("COMPLETED", new RunnerExecution.Compile(true, "", false, 700),
				List.of(runs), 1000);
	}

	private static RunnerExecution.Run ok(String stdout) {
		return new RunnerExecution.Run(0, false, stdout, false, "", false, 30);
	}

	private static RunnerExecution.Run crashed() {
		return new RunnerExecution.Run(1, false, "", false, "Exception in thread \"main\"", false, 20);
	}

}
