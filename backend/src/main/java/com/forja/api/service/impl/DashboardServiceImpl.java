package com.forja.api.service.impl;

import com.forja.api.dto.CourseProgressResponse;
import com.forja.api.dto.DashboardResponse;
import com.forja.api.dto.DashboardResponse.Achievement;
import com.forja.api.dto.DashboardResponse.ActivityDay;
import com.forja.api.dto.DashboardResponse.CourseCard;
import com.forja.api.dto.DashboardResponse.DailyGoal;
import com.forja.api.dto.DashboardResponse.ReviewItem;
import com.forja.api.dto.DashboardResponse.Level;
import com.forja.api.dto.DashboardResponse.RecentSubmission;
import com.forja.api.dto.DashboardResponse.Streak;
import com.forja.api.dto.DashboardResponse.Totals;
import com.forja.api.dto.ModuleRefResponse;
import com.forja.api.dto.ModuleProgressResponse;
import com.forja.api.dto.UserResponse;
import com.forja.api.entity.Course;
import com.forja.api.entity.ExerciseProgress;
import com.forja.api.entity.LessonProgress;
import com.forja.api.learning.LevelTable;
import com.forja.api.learning.StreakCalculator;
import com.forja.api.learning.XpPolicy;
import com.forja.api.mapper.RefMapper;
import com.forja.api.repository.CourseRepository;
import com.forja.api.repository.ExerciseOutline;
import com.forja.api.repository.ExerciseProgressRepository;
import com.forja.api.repository.ExerciseRepository;
import com.forja.api.repository.LessonOutline;
import com.forja.api.repository.LessonProgressRepository;
import com.forja.api.repository.LessonRepository;
import com.forja.api.repository.SubmissionRepository;
import com.forja.api.service.AuthService;
import com.forja.api.service.DashboardService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

	/** Activity grid: 12 full weeks. */
	private static final int ACTIVITY_DAYS = 84;

	/** Far enough back to find the longest streak of a learner on a long run. */
	private static final int STREAK_LOOKBACK_DAYS = 400;

	private static final int RECENT_SUBMISSIONS = 6;

	private static final int REVIEWS_SHOWN = 3;

	private final AuthService authService;

	private final CourseRepository courseRepository;

	private final LessonRepository lessonRepository;

	private final ExerciseRepository exerciseRepository;

	private final LessonProgressRepository lessonProgressRepository;

	private final ExerciseProgressRepository exerciseProgressRepository;

	private final SubmissionRepository submissionRepository;

	private final CourseProgressCalculator calculator;

	private final RefMapper refMapper;

	private final Clock clock;

	private final ExperienceTracker experienceTracker;

	public DashboardServiceImpl(AuthService authService, CourseRepository courseRepository,
			LessonRepository lessonRepository, ExerciseRepository exerciseRepository,
			LessonProgressRepository lessonProgressRepository, ExerciseProgressRepository exerciseProgressRepository,
			SubmissionRepository submissionRepository, CourseProgressCalculator calculator, RefMapper refMapper,
			Clock clock, ExperienceTracker experienceTracker) {
		this.experienceTracker = experienceTracker;
		this.authService = authService;
		this.courseRepository = courseRepository;
		this.lessonRepository = lessonRepository;
		this.exerciseRepository = exerciseRepository;
		this.lessonProgressRepository = lessonProgressRepository;
		this.exerciseProgressRepository = exerciseProgressRepository;
		this.submissionRepository = submissionRepository;
		this.calculator = calculator;
		this.refMapper = refMapper;
		this.clock = clock;
	}

	@Override
	public DashboardResponse build(Long userId, ZoneId zone) {
		UserResponse user = authService.findUser(userId);
		List<LessonProgress> lessonProgress = lessonProgressRepository.findByUserId(userId);
		List<ExerciseProgress> exerciseProgress = exerciseProgressRepository.findByUserId(userId);

		Set<Long> completedLessons = lessonProgress.stream()
			.map(progress -> progress.getLesson().getId())
			.collect(Collectors.toSet());
		Set<Long> solvedExercises = exerciseProgress.stream()
			.filter(ExerciseProgress::isSolved)
			.map(progress -> progress.getExercise().getId())
			.collect(Collectors.toSet());
		Set<Long> attemptedExercises = exerciseProgress.stream()
			.filter(progress -> progress.getAttempts() > 0)
			.map(progress -> progress.getExercise().getId())
			.collect(Collectors.toSet());

		int xp = lessonProgress.size() * XpPolicy.LESSON_XP
				+ exerciseProgress.stream().mapToInt(ExerciseProgress::getXpAwarded).sum();
		LevelTable.Level level = LevelTable.levelFor(xp);

		LocalDate today = LocalDate.now(clock.withZone(zone));
		Instant since = today.minusDays(STREAK_LOOKBACK_DAYS).atStartOfDay(zone).toInstant();
		Map<LocalDate, Integer> activityByDay = new HashMap<>();
		lessonProgressRepository.findCompletionTimesSince(userId, since)
			.forEach(time -> activityByDay.merge(time.atZone(zone).toLocalDate(), 1, Integer::sum));
		submissionRepository.findSubmissionTimesSince(userId, since)
			.forEach(time -> activityByDay.merge(time.atZone(zone).toLocalDate(), 1, Integer::sum));
		StreakCalculator.Streak streak = StreakCalculator.calculate(activityByDay.keySet(), today);
		List<ActivityDay> activity = new ArrayList<>();
		for (int offset = ACTIVITY_DAYS - 1; offset >= 0; offset--) {
			LocalDate day = today.minusDays(offset);
			activity.add(new ActivityDay(day, activityByDay.getOrDefault(day, 0)));
		}

		List<CourseCard> courses = new ArrayList<>();
		List<CourseProgressResponse> progressByCourse = new ArrayList<>();
		for (Course course : courseRepository.findByPublishedTrueOrderByDisplayOrderAsc()) {
			List<LessonOutline> lessons = lessonRepository.findOutlinesByCourse(course.getId());
			List<ExerciseOutline> exercises = exerciseRepository.findOutlinesByCourse(course.getId());
			if (lessons.isEmpty() && exercises.isEmpty()) {
				continue;
			}
			CourseProgressResponse progress = calculator.calculate(course.getId(), lessons, exercises,
					completedLessons, solvedExercises, attemptedExercises);
			progressByCourse.add(progress);
			ModuleRefResponse currentModule = progress.nextLesson() == null ? null
					: lessons.stream()
						.filter(lesson -> lesson.id().equals(progress.nextLesson().id()))
						.findFirst()
						.map(refMapper::moduleOf)
						.orElse(null);
			courses.add(new CourseCard(refMapper.toRef(course), progress.percent(), progress.completedLessons(),
					progress.totalLessons(), progress.solvedExercises(), progress.totalExercises(), currentModule,
					progress.nextLesson()));
		}

		List<RecentSubmission> recent = submissionRepository
			.findByUserIdOrderByCreatedAtDesc(userId, Limit.of(RECENT_SUBMISSIONS))
			.stream()
			.map(submission -> new RecentSubmission(submission.getExercise().getSlug(),
					submission.getExercise().getTitle(), submission.getStatus(), submission.getPassedTests(),
					submission.getTotalTests(), submission.getCreatedAt()))
			.toList();

		int learningMinutes = lessonProgress.stream()
			.mapToInt(progress -> progress.getLesson().getEstimatedMinutes())
			.sum();
		Totals totals = new Totals(lessonProgress.size(), solvedExercises.size(), submissionRepository.countByUserId(userId),
				learningMinutes);

		return new DashboardResponse(user, xp,
				new Level(level.number(), level.title(), level.minXp(), level.nextLevelXp()),
				new Streak(streak.current(), streak.longest(), streak.activeToday()), totals, activity, courses, recent,
				achievements(lessonProgress, exerciseProgress, streak, progressByCourse),
				new DailyGoal(user.dailyGoalXp(),
						experienceTracker.xpSince(userId, today.atStartOfDay(zone).toInstant())),
				exerciseProgressRepository.findDueReviews(userId, clock.instant(), Limit.of(REVIEWS_SHOWN))
					.stream()
					.map(progress -> new ReviewItem(progress.getExercise().getSlug(), progress.getExercise().getTitle(),
							progress.getExercise().getModule().getTitle(), progress.getSolvedAt()))
					.toList(),
				exerciseProgressRepository.countDueReviews(userId, clock.instant()));
	}

	private static List<Achievement> achievements(List<LessonProgress> lessons, List<ExerciseProgress> exercises,
			StreakCalculator.Streak streak, List<CourseProgressResponse> courses) {
		long solved = exercises.stream().filter(ExerciseProgress::isSolved).count();
		boolean unaided = exercises.stream()
			.anyMatch(progress -> progress.isSolved() && progress.getHintsRevealed() == 0
					&& !progress.isSolutionViewed());
		boolean moduleDone = courses.stream()
			.flatMap(course -> course.modules().stream())
			.anyMatch(ModuleProgressResponse::completed);
		int bestPercent = courses.stream().mapToInt(CourseProgressResponse::percent).max().orElse(0);
		return List.of(
				new Achievement("first-lesson", "Primera chispa", "Completa tu primera lección.", !lessons.isEmpty()),
				new Achievement("first-exercise", "Primer golpe de martillo", "Resuelve tu primer ejercicio.",
						solved >= 1),
				new Achievement("unaided", "Sin ayuda", "Resuelve un ejercicio sin pistas ni solución.", unaided),
				new Achievement("module-complete", "Módulo templado",
						"Completa todas las lecciones y ejercicios de un módulo.", moduleDone),
				new Achievement("ten-exercises", "Diez piezas", "Resuelve 10 ejercicios.", solved >= 10),
				new Achievement("streak-7", "Una semana en la fragua", "Mantén una racha de 7 días.",
						streak.longest() >= 7),
				new Achievement("half-course", "Mitad del camino", "Llega al 50 % de un curso.", bestPercent >= 50),
				new Achievement("course-complete", "Maestro del oficio", "Completa un curso entero.",
						bestPercent >= 100));
	}

}
