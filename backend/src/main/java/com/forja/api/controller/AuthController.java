package com.forja.api.controller;

import com.forja.api.dto.ApiErrorResponse;
import com.forja.api.dto.AuthResponse;
import com.forja.api.dto.DailyGoalRequest;
import com.forja.api.dto.LoginRequest;
import com.forja.api.dto.RegisterRequest;
import com.forja.api.dto.UserResponse;
import com.forja.api.security.CurrentUser;
import com.forja.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth", description = "Accounts and access tokens.")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create an account", description = "Returns an access token, so the learner is signed in straight away.")
	@ApiResponse(responseCode = "201", description = "Account created.")
	@ApiResponse(responseCode = "400", description = "Invalid data.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	@ApiResponse(responseCode = "409", description = "The email is already registered.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	@Operation(summary = "Sign in")
	@ApiResponse(responseCode = "200", description = "Signed in.")
	@ApiResponse(responseCode = "401", description = "Wrong email or password.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@GetMapping("/me")
	@Operation(summary = "The signed-in learner", security = @SecurityRequirement(name = "bearer"))
	@ApiResponse(responseCode = "200", description = "The account behind the token.")
	@ApiResponse(responseCode = "401", description = "Missing, invalid or expired token.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public UserResponse me(@AuthenticationPrincipal Jwt token) {
		return authService.findUser(CurrentUser.id(token));
	}

	@PutMapping("/me/daily-goal")
	@Operation(summary = "Change the daily goal", description = "Experience per day, between 10 and 500.",
			security = @SecurityRequirement(name = "bearer"))
	@ApiResponse(responseCode = "200", description = "The account with its new goal.")
	@ApiResponse(responseCode = "400", description = "The goal is out of range.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public UserResponse changeDailyGoal(@AuthenticationPrincipal Jwt token,
			@Valid @RequestBody DailyGoalRequest request) {
		return authService.changeDailyGoal(CurrentUser.id(token), request.dailyGoalXp());
	}

}
