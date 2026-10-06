package com.forja.api.controller;

import com.forja.api.dto.ApiErrorResponse;
import com.forja.api.dto.ExerciseDetailResponse;
import com.forja.api.dto.ExerciseProgressResponse;
import com.forja.api.dto.SolutionResponse;
import com.forja.api.dto.SubmissionRequest;
import com.forja.api.dto.SubmissionResultResponse;
import com.forja.api.security.CurrentUser;
import com.forja.api.service.ExerciseService;
import com.forja.api.util.SlugRules;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exercises")
@Tag(name = "Exercises", description = "Statements, hints, solutions and automatic grading.")
public class ExerciseController {

	private final ExerciseService exerciseService;

	public ExerciseController(ExerciseService exerciseService) {
		this.exerciseService = exerciseService;
	}

	@GetMapping("/{slug}")
	@Operation(summary = "Get an exercise", description = "Statement, starter code and sample tests. Public.")
	@ApiResponse(responseCode = "200", description = "Exercise found.")
	@ApiResponse(responseCode = "404", description = "No published exercise has that slug.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public ExerciseDetailResponse getExercise(@Parameter(example = "hola-mundo") @PathVariable
	@Pattern(regexp = SlugRules.PATTERN, message = SlugRules.MESSAGE) String slug) {
		return exerciseService.findBySlug(slug);
	}

	@GetMapping("/{slug}/progress")
	@Operation(summary = "The learner's progress on an exercise", security = @SecurityRequirement(name = "bearer"))
	public ExerciseProgressResponse getProgress(@AuthenticationPrincipal Jwt token, @PathVariable
	@Pattern(regexp = SlugRules.PATTERN, message = SlugRules.MESSAGE) String slug) {
		return exerciseService.findProgress(CurrentUser.id(token), slug);
	}

	@PostMapping("/{slug}/hints")
	@Operation(summary = "Reveal the next hint",
			description = "Each hint lowers the experience a later correct submission earns.",
			security = @SecurityRequirement(name = "bearer"))
	public ExerciseProgressResponse revealHint(@AuthenticationPrincipal Jwt token, @PathVariable
	@Pattern(regexp = SlugRules.PATTERN, message = SlugRules.MESSAGE) String slug) {
		return exerciseService.revealHint(CurrentUser.id(token), slug);
	}

	@PostMapping("/{slug}/solution")
	@Operation(summary = "Reveal the reference solution",
			description = "Solving the exercise after seeing it earns no experience.",
			security = @SecurityRequirement(name = "bearer"))
	public SolutionResponse revealSolution(@AuthenticationPrincipal Jwt token, @PathVariable
	@Pattern(regexp = SlugRules.PATTERN, message = SlugRules.MESSAGE) String slug) {
		return exerciseService.revealSolution(CurrentUser.id(token), slug);
	}

	@PostMapping("/{slug}/submissions")
	@Operation(summary = "Submit a solution",
			description = "Runs the code against every test case in the sandbox. Hidden cases report only whether they passed.",
			security = @SecurityRequirement(name = "bearer"))
	@ApiResponse(responseCode = "200", description = "Graded; the verdict is in the body.")
	@ApiResponse(responseCode = "429", description = "Too many submissions in a short time.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	@ApiResponse(responseCode = "503", description = "The sandbox is unavailable.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public SubmissionResultResponse submit(@AuthenticationPrincipal Jwt token, @PathVariable
	@Pattern(regexp = SlugRules.PATTERN, message = SlugRules.MESSAGE) String slug,
			@Valid @RequestBody SubmissionRequest request) {
		return exerciseService.submit(CurrentUser.id(token), slug, request.sourceCode());
	}

}
