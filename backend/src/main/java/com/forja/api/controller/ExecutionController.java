package com.forja.api.controller;

import com.forja.api.dto.ApiErrorResponse;
import com.forja.api.dto.ExecutionRequest;
import com.forja.api.dto.ExecutionResponse;
import com.forja.api.security.CurrentUser;
import com.forja.api.service.PlaygroundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
@RequestMapping("/api/executions")
@Tag(name = "Executions", description = "Running code in the playground.")
public class ExecutionController {

	private final PlaygroundService playgroundService;

	public ExecutionController(PlaygroundService playgroundService) {
		this.playgroundService = playgroundService;
	}

	@PostMapping
	@Operation(summary = "Run a program", description = "Compiles and runs it once in an isolated sandbox.",
			security = @SecurityRequirement(name = "bearer"))
	@ApiResponse(responseCode = "200", description = "It ran (or failed to compile); the outcome is in the body.")
	@ApiResponse(responseCode = "429", description = "Too many runs in a short time.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	@ApiResponse(responseCode = "503", description = "The sandbox is unavailable.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public ExecutionResponse run(@AuthenticationPrincipal Jwt token, @Valid @RequestBody ExecutionRequest request) {
		return playgroundService.run(CurrentUser.id(token), request);
	}

}
