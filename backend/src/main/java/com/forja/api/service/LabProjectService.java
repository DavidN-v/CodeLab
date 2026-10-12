package com.forja.api.service;

import com.forja.api.dto.LabProjectRequest;
import com.forja.api.dto.LabProjectResponse;
import com.forja.api.dto.LabProjectSummaryResponse;
import com.forja.api.dto.LabVersionResponse;
import java.util.List;

/** The learner's own lab projects. Every operation is scoped to the learner who owns them. */
public interface LabProjectService {

	List<LabProjectSummaryResponse> list(Long userId);

	LabProjectResponse get(Long userId, Long projectId);

	LabProjectResponse create(Long userId, LabProjectRequest request);

	LabProjectResponse update(Long userId, Long projectId, LabProjectRequest request);

	/** Moves a project to a folder without touching its content. */
	LabProjectSummaryResponse move(Long userId, Long projectId, String folder);

	void delete(Long userId, Long projectId);

	LabProjectResponse duplicate(Long userId, Long projectId);

	List<LabVersionResponse> versions(Long userId, Long projectId);

	/** Stores the project's current content as a save point. */
	LabVersionResponse saveVersion(Long userId, Long projectId, String label);

	/** Puts a save point back as the project's content, keeping the current one as a new save point. */
	LabProjectResponse restoreVersion(Long userId, Long projectId, Long versionId);

}
