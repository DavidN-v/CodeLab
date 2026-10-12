package com.forja.api.controller;

import com.forja.api.dto.LabProjectRequest;
import com.forja.api.dto.LabProjectResponse;
import com.forja.api.dto.LabProjectSummaryResponse;
import com.forja.api.dto.LabVersionRequest;
import com.forja.api.dto.LabVersionResponse;
import com.forja.api.security.CurrentUser;
import com.forja.api.service.LabProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lab/projects")
@Tag(name = "Lab", description = "Práctica general: the learner's own projects and their save points.")
@SecurityRequirement(name = "bearer")
public class LabProjectController {

	private final LabProjectService service;

	public LabProjectController(LabProjectService service) {
		this.service = service;
	}

	@GetMapping
	@Operation(summary = "List my projects, most recent first")
	public List<LabProjectSummaryResponse> list(@AuthenticationPrincipal Jwt token) {
		return service.list(CurrentUser.id(token));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Create a project")
	public LabProjectResponse create(@AuthenticationPrincipal Jwt token,
			@Valid @RequestBody LabProjectRequest request) {
		return service.create(CurrentUser.id(token), request);
	}

	@GetMapping("/{id}")
	@Operation(summary = "Open one of my projects")
	public LabProjectResponse get(@AuthenticationPrincipal Jwt token, @PathVariable Long id) {
		return service.get(CurrentUser.id(token), id);
	}

	@PutMapping("/{id}")
	@Operation(summary = "Save a project")
	public LabProjectResponse update(@AuthenticationPrincipal Jwt token, @PathVariable Long id,
			@Valid @RequestBody LabProjectRequest request) {
		return service.update(CurrentUser.id(token), id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Delete a project and its save points")
	public void delete(@AuthenticationPrincipal Jwt token, @PathVariable Long id) {
		service.delete(CurrentUser.id(token), id);
	}

	@PostMapping("/{id}/duplicate")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Copy a project")
	public LabProjectResponse duplicate(@AuthenticationPrincipal Jwt token, @PathVariable Long id) {
		return service.duplicate(CurrentUser.id(token), id);
	}

	@GetMapping("/{id}/versions")
	@Operation(summary = "List the save points of a project")
	public List<LabVersionResponse> versions(@AuthenticationPrincipal Jwt token, @PathVariable Long id) {
		return service.versions(CurrentUser.id(token), id);
	}

	@PostMapping("/{id}/versions")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Keep the project's current content as a save point")
	public LabVersionResponse saveVersion(@AuthenticationPrincipal Jwt token, @PathVariable Long id,
			@Valid @RequestBody LabVersionRequest request) {
		return service.saveVersion(CurrentUser.id(token), id, request.label());
	}

	@PostMapping("/{id}/versions/{versionId}/restore")
	@Operation(summary = "Go back to a save point",
			description = "The content it replaces is kept as a new save point.")
	public LabProjectResponse restore(@AuthenticationPrincipal Jwt token, @PathVariable Long id,
			@PathVariable Long versionId) {
		return service.restoreVersion(CurrentUser.id(token), id, versionId);
	}

}
