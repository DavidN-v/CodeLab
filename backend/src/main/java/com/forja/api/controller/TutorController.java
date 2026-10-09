package com.forja.api.controller;

import com.forja.api.dto.ApiErrorResponse;
import com.forja.api.dto.TutorAnswerResponse;
import com.forja.api.dto.TutorCodeRequest;
import com.forja.api.dto.TutorExplainRequest;
import com.forja.api.dto.TutorStatusResponse;
import com.forja.api.security.CurrentUser;
import com.forja.api.tutor.TutorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tutor")
@Tag(name = "Tutor", description = "AI help: another explanation, a debugging hint, a code review.")
public class TutorController {

	private final TutorService tutorService;

	public TutorController(TutorService tutorService) {
		this.tutorService = tutorService;
	}

	@GetMapping("/status")
	@Operation(summary = "Whether the tutor is available", security = @SecurityRequirement(name = "bearer"))
	public TutorStatusResponse status() {
		return new TutorStatusResponse(tutorService.enabled());
	}

	@PostMapping("/explain")
	@Operation(summary = "Explain a lesson another way", security = @SecurityRequirement(name = "bearer"))
	@ApiResponse(responseCode = "200", description = "The tutor's explanation.")
	@ApiResponse(responseCode = "429", description = "Too many questions in a short time.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	@ApiResponse(responseCode = "503", description = "The tutor is not configured or not reachable.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public TutorAnswerResponse explain(@AuthenticationPrincipal Jwt token,
			@Valid @RequestBody TutorExplainRequest request) {
		return new TutorAnswerResponse(
				tutorService.explainLesson(CurrentUser.id(token), request.lessonId(), request.question()));
	}

	@PostMapping("/debug")
	@Operation(summary = "Get a hint about why a program fails",
			description = "Points at the problem without writing the fixed program.",
			security = @SecurityRequirement(name = "bearer"))
	public TutorAnswerResponse debug(@AuthenticationPrincipal Jwt token, @Valid @RequestBody TutorCodeRequest request) {
		return new TutorAnswerResponse(tutorService.debug(CurrentUser.id(token), request.exerciseSlug(),
				request.sourceCode(), request.result()));
	}

	@PostMapping("/review")
	@Operation(summary = "Review a solution", security = @SecurityRequirement(name = "bearer"))
	public TutorAnswerResponse review(@AuthenticationPrincipal Jwt token, @Valid @RequestBody TutorCodeRequest request) {
		return new TutorAnswerResponse(
				tutorService.review(CurrentUser.id(token), request.exerciseSlug(), request.sourceCode()));
	}

}
