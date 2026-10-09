package com.forja.api.service.impl;

import com.forja.api.client.CodeRunnerClient;
import com.forja.api.client.RunnerExecution;
import com.forja.api.content.ContentTemplates;
import com.forja.api.dto.CelebrationResponse;
import com.forja.api.dto.ExerciseDetailResponse;
import com.forja.api.dto.ExerciseProgressResponse;
import com.forja.api.dto.ExerciseSummaryResponse;
import com.forja.api.dto.SampleTestResponse;
import com.forja.api.dto.SolutionResponse;
import com.forja.api.dto.SubmissionRequest;
import com.forja.api.dto.SubmissionResultResponse;
import com.forja.api.dto.SubmissionSummaryResponse;
import com.forja.api.dto.TestOutcome;
import com.forja.api.dto.TestResultResponse;
import com.forja.api.entity.Exercise;
import com.forja.api.entity.ExerciseHint;
import com.forja.api.entity.ExerciseKind;
import com.forja.api.entity.ExerciseProgress;
import com.forja.api.entity.Language;
import com.forja.api.entity.Submission;
import com.forja.api.entity.SubmissionStatus;
import com.forja.api.exception.InvalidRequestException;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.exception.TooManyRequestsException;
import com.forja.api.learning.Grader.Grade;
import com.forja.api.learning.Grader;
import com.forja.api.learning.OutputComparator;
import com.forja.api.learning.ParsonsPuzzle;
import com.forja.api.learning.PredictionFeedback;
import com.forja.api.learning.RateLimiter;
import com.forja.api.learning.StaticChecker;
import com.forja.api.learning.XpPolicy;
import com.forja.api.mapper.RefMapper;
import com.forja.api.repository.ExerciseOutline;
import com.forja.api.repository.ExerciseProgressRepository;
import com.forja.api.repository.ExerciseRepository;
import com.forja.api.repository.SubmissionRepository;
import com.forja.api.repository.UserRepository;
import com.forja.api.service.ExerciseService;
import java.time.Clock;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

/**
 * Transactions are opened explicitly: a submission waits seconds for the
 * sandbox, and no database transaction or connection is held meanwhile.
 */
@Service
public class ExerciseServiceImpl implements ExerciseService {

	private static final int RECENT_SUBMISSIONS = 5;

	private final ExerciseRepository exerciseRepository;

	private final ExerciseProgressRepository progressRepository;

	private final SubmissionRepository submissionRepository;

	private final UserRepository userRepository;

	private final CodeRunnerClient codeRunnerClient;

	private final RateLimiter rateLimiter;

	private final RefMapper refMapper;

	private final Clock clock;

	private final TransactionTemplate readTransaction;

	private final TransactionTemplate writeTransaction;

	private final ExperienceTracker experienceTracker;

	private final JsonMapper jsonMapper = JsonMapper.builder().build();

	public ExerciseServiceImpl(ExerciseRepository exerciseRepository, ExerciseProgressRepository progressRepository,
			SubmissionRepository submissionRepository, UserRepository userRepository,
			CodeRunnerClient codeRunnerClient, @Qualifier("submissionRateLimiter") RateLimiter rateLimiter,
			RefMapper refMapper, Clock clock, PlatformTransactionManager transactionManager,
			ExperienceTracker experienceTracker) {
		this.experienceTracker = experienceTracker;
		this.exerciseRepository = exerciseRepository;
		this.progressRepository = progressRepository;
		this.submissionRepository = submissionRepository;
		this.userRepository = userRepository;
		this.codeRunnerClient = codeRunnerClient;
		this.rateLimiter = rateLimiter;
		this.refMapper = refMapper;
		this.clock = clock;
		this.readTransaction = new TransactionTemplate(transactionManager);
		this.readTransaction.setReadOnly(true);
		this.writeTransaction = new TransactionTemplate(transactionManager);
	}

	@Override
	public ExerciseDetailResponse findBySlug(String slug) {
		return readTransaction.execute(status -> {
			Exercise exercise = findExercise(slug);
			Long courseId = exercise.getModule().getCourse().getId();
			List<ExerciseOutline> outline = exerciseRepository.findOutlinesByCourse(courseId);
			int index = -1;
			for (int i = 0; i < outline.size(); i++) {
				if (outline.get(i).id().equals(exercise.getId())) {
					index = i;
				}
			}
			ExerciseSummaryResponse previous = index > 0 ? refMapper.toSummary(outline.get(index - 1)) : null;
			ExerciseSummaryResponse next = index >= 0 && index < outline.size() - 1
					? refMapper.toSummary(outline.get(index + 1)) : null;
			boolean predict = exercise.getKind() == ExerciseKind.PREDICT;
			// The output of a prediction is its answer: only the input is shown.
			List<SampleTestResponse> samples = exercise.getTestCases()
				.stream()
				.filter(testCase -> predict ? !testCase.getStdin().isEmpty() : testCase.isSample())
				.map(testCase -> new SampleTestResponse(testCase.getStdin(),
						predict ? null : testCase.getExpectedStdout()))
				.toList();
			List<String> parsonsLines = exercise.getKind() == ExerciseKind.PARSONS
					? ParsonsPuzzle.shuffled(exercise.getSlug(), parsonsData(exercise)) : null;
			return new ExerciseDetailResponse(exercise.getId(), exercise.getSlug(), exercise.getTitle(),
					exercise.getSummary(), exercise.getDifficulty(), exercise.getKind(),
					exercise.getStatementMarkdown(), exercise.getStarterCode(), parsonsLines, samples, exercise.getTestCases().size(), exercise.getHints().size(),
					XpPolicy.baseXp(exercise.getDifficulty()), refMapper.toRef(exercise.getModule().getCourse()),
					refMapper.toRef(exercise.getModule()), previous, next);
		});
	}

	@Override
	public ExerciseProgressResponse findProgress(Long userId, String slug) {
		return readTransaction.execute(status -> {
			Exercise exercise = findExercise(slug);
			ExerciseProgress progress = progressRepository.findByUserIdAndExerciseId(userId, exercise.getId())
				.orElse(null);
			return toProgress(userId, exercise, progress);
		});
	}

	@Override
	public ExerciseProgressResponse revealHint(Long userId, String slug) {
		return writeTransaction.execute(status -> {
			Exercise exercise = findExercise(slug);
			ExerciseProgress progress = progressFor(userId, exercise);
			progress.revealHint(exercise.getHints().size());
			return toProgress(userId, exercise, progress);
		});
	}

	@Override
	public SolutionResponse revealSolution(Long userId, String slug) {
		return writeTransaction.execute(status -> {
			Exercise exercise = findExercise(slug);
			progressFor(userId, exercise).markSolutionViewed();
			return new SolutionResponse(exercise.getSolutionCode());
		});
	}

	@Override
	public SubmissionResultResponse submit(Long userId, String slug, SubmissionRequest request) {
		if (!rateLimiter.tryAcquire(userId)) {
			throw new TooManyRequestsException("Has enviado muchas soluciones seguidas. Espera un minuto.");
		}
		ExerciseToRun toRun = readTransaction.execute(status -> {
			Exercise exercise = findExercise(slug);
			List<Grader.TestCase> cases = exercise.getTestCases()
				.stream()
				.map(testCase -> new Grader.TestCase(testCase.getPosition(), testCase.getStdin(),
						testCase.getExpectedStdout(), testCase.isSample()))
				.toList();
			Language language = exercise.getModule().getCourse().getLanguage();
			StaticChecker.Verdict verdict = language.isRunnable() ? null : checkStatically(exercise, request);
			return new ExerciseToRun(exercise.getId(), language.getSlug(), exercise.getKind(),
					program(exercise, request), cases, verdict);
		});

		Grade grade;
		String feedback = null;
		if (toRun.kind() == ExerciseKind.PREDICT) {
			Grader.TestCase expected = toRun.cases().get(0);
			boolean right = OutputComparator.matches(expected.expectedStdout(), toRun.program());
			feedback = right ? null : PredictionFeedback.describe(expected.expectedStdout(), toRun.program());
			grade = new Grade(right ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER, right ? 1 : 0, 1,
					null, null, List.of(new TestResultResponse(1, false,
							right ? TestOutcome.PASSED : TestOutcome.WRONG_OUTPUT, null, null, null, null)));
		}
		else if (toRun.verdict() != null) {
			boolean right = toRun.verdict().right();
			feedback = toRun.verdict().feedback();
			grade = new Grade(right ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER, right ? 1 : 0, 1,
					null, null, List.of(new TestResultResponse(1, false,
							right ? TestOutcome.PASSED : TestOutcome.WRONG_OUTPUT, null, null, null, null)));
		}
		else {
			RunnerExecution.Result result = codeRunnerClient.execute(toRun.languageSlug(), toRun.program(),
					toRun.cases().stream().map(Grader.TestCase::stdin).toList());
			grade = Grader.grade(toRun.cases(), result);
		}
		String feedbackText = feedback;

		return writeTransaction.execute(status -> {
			Exercise exercise = exerciseRepository.findById(toRun.exerciseId()).orElseThrow();
			ExerciseProgress progress = progressFor(userId, exercise);
			progress.recordAttempt();
			int xp = 0;
			boolean firstSolve = false;
			boolean reviewPassed = false;
			if (grade.status() == SubmissionStatus.ACCEPTED) {
				int earned = XpPolicy.exerciseXp(exercise.getDifficulty(), progress.getHintsRevealed(),
						progress.isSolutionViewed());
				reviewPassed = progress.passReview(clock.instant());
				firstSolve = progress.markSolved(clock.instant(), earned);
				xp = firstSolve ? earned : 0;
			}
			Submission submission = submissionRepository.save(new Submission(userRepository.getReferenceById(userId),
					exercise, toRun.program(), grade.status(), grade.passed(), grade.total(), grade.slowestRunMs()));
			CelebrationResponse celebration = null;
			if (firstSolve) {
				progressRepository.flush();
				celebration = experienceTracker.celebrate(userId, xp, exercise.getModule());
			}
			return new SubmissionResultResponse(submission.getId(), grade.status(), grade.passed(), grade.total(),
					grade.slowestRunMs(), grade.compileOutput(), grade.tests(), firstSolve, xp, feedbackText,
					reviewPassed, celebration);
		});
	}

	/** The program to grade: what the learner wrote, or the starter completed with their parts. */
	private static String program(Exercise exercise, SubmissionRequest request) {
		List<String> parts = request.parts() == null ? List.of() : request.parts();
		return switch (exercise.getKind()) {
			case FILL -> {
				int blanks = ContentTemplates.countBlanks(exercise.getStarterCode());
				if (parts.size() != blanks) {
					throw new InvalidRequestException("Rellena los %d huecos.".formatted(blanks));
				}
				yield ContentTemplates.fill(exercise.getStarterCode(), parts);
			}
			case PARSONS -> {
				if (parts.isEmpty()) {
					throw new InvalidRequestException("Coloca al menos una línea en tu programa.");
				}
				yield ContentTemplates.assemble(exercise.getStarterCode(), parts);
			}
			case PREDICT -> request.sourceCode() == null ? "" : request.sourceCode();
			default -> {
				if (request.sourceCode() == null || request.sourceCode().isBlank()) {
					throw new InvalidRequestException("El código no puede estar vacío.");
				}
				yield request.sourceCode();
			}
		};
	}

	/** Without a sandbox for the language, fill and parsons answers are compared with the solution. */
	private StaticChecker.Verdict checkStatically(Exercise exercise, SubmissionRequest request) {
		List<String> parts = request.parts() == null ? List.of() : request.parts();
		return switch (exercise.getKind()) {
			case FILL -> StaticChecker.checkBlanks(exercise.getStarterCode(), exercise.getSolutionCode(), parts);
			case PARSONS -> StaticChecker.checkLines(parsonsData(exercise).lines(), parts);
			case PREDICT -> null;
			default -> throw new InvalidRequestException("Este ejercicio no se puede corregir en esta plataforma.");
		};
	}

	private ParsonsPuzzle.Data parsonsData(Exercise exercise) {
		return jsonMapper.readValue(exercise.getParsonsJson(), ParsonsPuzzle.Data.class);
	}

	private Exercise findExercise(String slug) {
		return exerciseRepository.findPublishedBySlug(slug)
			.orElseThrow(() -> new ResourceNotFoundException("No existe el ejercicio '%s'.".formatted(slug)));
	}

	/** Existing progress row, or a new one. Must run inside a write transaction. */
	private ExerciseProgress progressFor(Long userId, Exercise exercise) {
		return progressRepository.findByUserIdAndExerciseId(userId, exercise.getId())
			.orElseGet(() -> progressRepository.save(new ExerciseProgress(userRepository.getReferenceById(userId),
					exercise)));
	}

	private ExerciseProgressResponse toProgress(Long userId, Exercise exercise, ExerciseProgress progress) {
		List<SubmissionSummaryResponse> recent = submissionRepository
			.findByUserIdAndExerciseIdOrderByCreatedAtDesc(userId, exercise.getId(), Limit.of(RECENT_SUBMISSIONS))
			.stream()
			.map(submission -> new SubmissionSummaryResponse(submission.getId(), submission.getStatus(),
					submission.getPassedTests(), submission.getTotalTests(), submission.getCreatedAt()))
			.toList();
		String lastCode = recent.isEmpty() ? null
				: submissionRepository.findById(recent.get(0).id()).map(Submission::getSourceCode).orElse(null);
		List<ExerciseHint> hints = exercise.getHints();
		if (progress == null) {
			return new ExerciseProgressResponse(0, false, null, List.of(), hints.size(), false,
					XpPolicy.exerciseXp(exercise.getDifficulty(), 0, false), lastCode, recent, false);
		}
		int xp = progress.isSolved() ? progress.getXpAwarded()
				: XpPolicy.exerciseXp(exercise.getDifficulty(), progress.getHintsRevealed(), progress.isSolutionViewed());
		List<String> revealed = hints.stream()
			.limit(progress.getHintsRevealed())
			.map(ExerciseHint::getContent)
			.toList();
		return new ExerciseProgressResponse(progress.getAttempts(), progress.isSolved(), progress.getSolvedAt(),
				revealed, hints.size(), progress.isSolutionViewed(), xp, lastCode, recent,
				progress.isReviewDue(clock.instant()));
	}

	/** {@code verdict} is set when the answer was graded without running it. */
	private record ExerciseToRun(Long exerciseId, String languageSlug, ExerciseKind kind, String program,
			List<Grader.TestCase> cases, StaticChecker.Verdict verdict) {
	}

}
