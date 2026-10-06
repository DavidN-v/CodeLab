package com.forja.api.service.impl;

import com.forja.api.client.CodeRunnerClient;
import com.forja.api.client.RunnerExecution;
import com.forja.api.dto.ExerciseDetailResponse;
import com.forja.api.dto.ExerciseProgressResponse;
import com.forja.api.dto.ExerciseSummaryResponse;
import com.forja.api.dto.SampleTestResponse;
import com.forja.api.dto.SolutionResponse;
import com.forja.api.dto.SubmissionResultResponse;
import com.forja.api.dto.SubmissionSummaryResponse;
import com.forja.api.entity.Exercise;
import com.forja.api.entity.ExerciseHint;
import com.forja.api.entity.ExerciseProgress;
import com.forja.api.entity.Submission;
import com.forja.api.entity.SubmissionStatus;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.exception.TooManyRequestsException;
import com.forja.api.learning.Grader;
import com.forja.api.learning.Grader.Grade;
import com.forja.api.learning.RateLimiter;
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

	public ExerciseServiceImpl(ExerciseRepository exerciseRepository, ExerciseProgressRepository progressRepository,
			SubmissionRepository submissionRepository, UserRepository userRepository,
			CodeRunnerClient codeRunnerClient, @Qualifier("submissionRateLimiter") RateLimiter rateLimiter,
			RefMapper refMapper, Clock clock, PlatformTransactionManager transactionManager) {
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
			List<SampleTestResponse> samples = exercise.getTestCases()
				.stream()
				.filter(testCase -> testCase.isSample())
				.map(testCase -> new SampleTestResponse(testCase.getStdin(), testCase.getExpectedStdout()))
				.toList();
			return new ExerciseDetailResponse(exercise.getId(), exercise.getSlug(), exercise.getTitle(),
					exercise.getSummary(), exercise.getDifficulty(), exercise.getStatementMarkdown(),
					exercise.getStarterCode(), samples, exercise.getTestCases().size(), exercise.getHints().size(),
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
	public SubmissionResultResponse submit(Long userId, String slug, String sourceCode) {
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
			return new ExerciseToRun(exercise.getId(), exercise.getModule().getCourse().getLanguage().getSlug(),
					cases);
		});

		RunnerExecution.Result result = codeRunnerClient.execute(toRun.languageSlug(), sourceCode,
				toRun.cases().stream().map(Grader.TestCase::stdin).toList());
		Grade grade = Grader.grade(toRun.cases(), result);

		return writeTransaction.execute(status -> {
			Exercise exercise = exerciseRepository.getReferenceById(toRun.exerciseId());
			ExerciseProgress progress = progressFor(userId, exercise);
			progress.recordAttempt();
			int xp = 0;
			boolean firstSolve = false;
			if (grade.status() == SubmissionStatus.ACCEPTED) {
				int earned = XpPolicy.exerciseXp(exercise.getDifficulty(), progress.getHintsRevealed(),
						progress.isSolutionViewed());
				firstSolve = progress.markSolved(clock.instant(), earned);
				xp = firstSolve ? earned : 0;
			}
			Submission submission = submissionRepository.save(new Submission(userRepository.getReferenceById(userId),
					exercise, sourceCode, grade.status(), grade.passed(), grade.total(), grade.slowestRunMs()));
			return new SubmissionResultResponse(submission.getId(), grade.status(), grade.passed(), grade.total(),
					grade.slowestRunMs(), grade.compileOutput(), grade.tests(), firstSolve, xp);
		});
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
					XpPolicy.exerciseXp(exercise.getDifficulty(), 0, false), lastCode, recent);
		}
		int xp = progress.isSolved() ? progress.getXpAwarded()
				: XpPolicy.exerciseXp(exercise.getDifficulty(), progress.getHintsRevealed(), progress.isSolutionViewed());
		List<String> revealed = hints.stream()
			.limit(progress.getHintsRevealed())
			.map(ExerciseHint::getContent)
			.toList();
		return new ExerciseProgressResponse(progress.getAttempts(), progress.isSolved(), progress.getSolvedAt(),
				revealed, hints.size(), progress.isSolutionViewed(), xp, lastCode, recent);
	}

	private record ExerciseToRun(Long exerciseId, String languageSlug, List<Grader.TestCase> cases) {
	}

}
