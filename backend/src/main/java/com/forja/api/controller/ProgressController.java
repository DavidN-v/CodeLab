package com.forja.api.controller;

import com.forja.api.dto.CourseProgressResponse;
import com.forja.api.dto.LessonCompletionResponse;
import com.forja.api.security.CurrentUser;
import com.forja.api.service.ProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/progress")
@Tag(name = "Progress", description = "What the learner has completed.")
public class ProgressController {

	private final ProgressService progressService;

	public ProgressController(ProgressService progressService) {
		this.progressService = progressService;
	}

	@PostMapping("/lessons/{lessonId}")
	@Operation(summary = "Mark a lesson as completed", description = "Idempotent.",
			security = @SecurityRequirement(name = "bearer"))
	public LessonCompletionResponse completeLesson(@AuthenticationPrincipal Jwt token,
			@PathVariable @Positive(message = "debe ser mayor que 0") Long lessonId) {
		return progressService.completeLesson(CurrentUser.id(token), lessonId);
	}

	@GetMapping("/courses/{courseId}")
	@Operation(summary = "Progress through a course", security = @SecurityRequirement(name = "bearer"))
	public CourseProgressResponse getCourseProgress(@AuthenticationPrincipal Jwt token,
			@PathVariable @Positive(message = "debe ser mayor que 0") Long courseId) {
		return progressService.findCourseProgress(CurrentUser.id(token), courseId);
	}

}
