package com.forja.api.dto;

import com.forja.api.entity.SubmissionStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Schema(name = "Dashboard", description = "Everything the student panel shows, in one request.")
public record DashboardResponse(
		UserResponse user,
		@Schema(example = "340") int xp,
		Level level,
		Streak streak,
		Totals totals,
		@Schema(description = "One entry per day of the last 12 weeks, oldest first.") List<ActivityDay> activity,
		List<CourseCard> courses,
		List<RecentSubmission> recentSubmissions,
		List<Achievement> achievements,
		DailyGoal dailyGoal,
		@Schema(description = "Solved exercises due for a spaced review, the most overdue first (at most 3).") List<ReviewItem> reviews,
		@Schema(description = "How many exercises are due for review in total.") long reviewsDue) {

	@Schema(name = "DailyGoal")
	public record DailyGoal(@Schema(example = "30") int goalXp,
			@Schema(description = "Experience earned today, in the learner's time zone.") int todayXp) {
	}

	@Schema(name = "ReviewItem")
	public record ReviewItem(String exerciseSlug, String exerciseTitle, String moduleTitle,
			@Schema(description = "When it was first solved.") Instant solvedAt) {
	}

	@Schema(name = "Level")
	public record Level(
			@Schema(example = "3") int number,
			@Schema(example = "Practicante") String title,
			@Schema(description = "Experience at which this level starts.") int currentLevelXp,
			@Schema(description = "Experience at which the next level starts; null at the top level.") Integer nextLevelXp) {
	}

	@Schema(name = "Streak")
	public record Streak(
			@Schema(description = "Consecutive days with activity, ending today or yesterday.") int current,
			int longest,
			boolean activeToday) {
	}

	@Schema(name = "Totals")
	public record Totals(int lessonsCompleted, int exercisesSolved, long submissions,
			@Schema(description = "Estimated minutes of study, from the lessons completed.") int learningMinutes) {
	}

	@Schema(name = "ActivityDay")
	public record ActivityDay(LocalDate date, int count) {
	}

	@Schema(name = "CourseCard")
	public record CourseCard(CourseRefResponse course, int percent, int completedLessons, int totalLessons,
			int solvedExercises, int totalExercises,
			@Schema(description = "Module of the next lesson; null when the course is finished.") ModuleRefResponse currentModule,
			LessonRefResponse nextLesson,
			@Schema(description = "Next lesson or exercise on the path; null when the course is finished.") NextStepResponse nextStep) {
	}

	@Schema(name = "RecentSubmission")
	public record RecentSubmission(String exerciseSlug, String exerciseTitle, SubmissionStatus status, int passedTests,
			int totalTests, Instant createdAt) {
	}

	@Schema(name = "Achievement")
	public record Achievement(@Schema(example = "first-exercise") String code, String title, String description,
			boolean earned) {
	}

}
