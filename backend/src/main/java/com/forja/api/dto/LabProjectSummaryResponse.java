package com.forja.api.dto;

import com.forja.api.entity.LabMode;
import com.forja.api.entity.LabProject;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(name = "LabProjectSummary")
public record LabProjectSummaryResponse(Long id, String name, String description, LabMode mode, String folder,
		Instant updatedAt) {

	public static LabProjectSummaryResponse of(LabProject project) {
		return new LabProjectSummaryResponse(project.getId(), project.getName(), project.getDescription(),
				project.getMode(), project.getFolder(), project.getUpdatedAt());
	}

}
