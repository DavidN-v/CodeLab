package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(name = "LessonCompletion")
public record LessonCompletionResponse(
		Long lessonId,
		Instant completedAt,
		@Schema(description = "False when it had already been completed; no experience is awarded twice.") boolean newlyCompleted,
		int xpAwarded,
		@Schema(description = "What to celebrate; null when nothing new happened.") CelebrationResponse celebration) {
}
