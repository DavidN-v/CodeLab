package com.forja.api.controller;

import com.forja.api.dto.LabFixResponse;
import com.forja.api.dto.LabHelpRequest;
import com.forja.api.dto.LabPlanRequest;
import com.forja.api.dto.LabPlanResponse;
import com.forja.api.dto.TutorAnswerResponse;
import com.forja.api.security.CurrentUser;
import com.forja.api.tutor.LabTutorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tutor/lab")
@Tag(name = "Lab tutor", description = "AI help in Práctica general: plan an idea, graded help, proposed fixes.")
@SecurityRequirement(name = "bearer")
public class LabTutorController {

	private final LabTutorService service;

	public LabTutorController(LabTutorService service) {
		this.service = service;
	}

	@PostMapping("/plan")
	@Operation(summary = "Turn an idea into a goal, requirements, steps and proposed tests")
	public LabPlanResponse plan(@AuthenticationPrincipal Jwt token, @Valid @RequestBody LabPlanRequest request) {
		return service.plan(CurrentUser.id(token), request);
	}

	@PostMapping("/help")
	@Operation(summary = "Help at the level the learner asks for",
			description = "From a short hint (1) to an example of the fix (4); 0 explains one problem in depth.")
	public TutorAnswerResponse help(@AuthenticationPrincipal Jwt token, @Valid @RequestBody LabHelpRequest request) {
		return new TutorAnswerResponse(service.help(CurrentUser.id(token), request));
	}

	@PostMapping("/fix")
	@Operation(summary = "Propose a corrected version of one file",
			description = "Nothing is applied: the learner compares it with their code and decides.")
	public LabFixResponse fix(@AuthenticationPrincipal Jwt token, @Valid @RequestBody LabHelpRequest request) {
		return service.fix(CurrentUser.id(token), request);
	}

}
