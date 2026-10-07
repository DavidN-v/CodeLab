package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

@Schema(name = "ExerciseProgress", description = "The learner's state on one exercise.")
public record ExerciseProgressResponse(
		int attempts,
		boolean solved,
		Instant solvedAt,
		@Schema(description = "Hints revealed so far, in order.") List<String> hints,
		int hintCount,
		boolean solutionViewed,
		@Schema(description = "Experience a correct submission would earn now (or did earn).") int xp,
		@Schema(description = "Code of the latest submission, to resume from; null if none.") String lastSubmittedCode,
		List<SubmissionSummaryResponse> recentSubmissions,
		@Schema(description = "Solved, and due for a spaced review.") boolean reviewDue) {
}
