package com.forja.api.controller;

import com.forja.api.dto.DashboardResponse;
import com.forja.api.exception.InvalidRequestException;
import com.forja.api.security.CurrentUser;
import com.forja.api.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "The student panel.")
public class DashboardController {

	private final DashboardService dashboardService;

	public DashboardController(DashboardService dashboardService) {
		this.dashboardService = dashboardService;
	}

	@GetMapping
	@Operation(summary = "Experience, level, streak, activity and course progress",
			security = @SecurityRequirement(name = "bearer"))
	public DashboardResponse getDashboard(@AuthenticationPrincipal Jwt token,
			@Parameter(description = "IANA time zone of the learner; days and streaks are counted in it.",
					example = "America/Bogota") @RequestParam(required = false) String timezone) {
		return dashboardService.build(CurrentUser.id(token), parseZone(timezone));
	}

	private static ZoneId parseZone(String timezone) {
		if (timezone == null || timezone.isBlank()) {
			return ZoneOffset.UTC;
		}
		try {
			return ZoneId.of(timezone);
		}
		catch (DateTimeException ex) {
			throw new InvalidRequestException("Zona horaria desconocida: " + timezone);
		}
	}

}
