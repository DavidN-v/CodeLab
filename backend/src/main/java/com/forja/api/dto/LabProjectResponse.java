package com.forja.api.dto;

import com.forja.api.entity.LabMode;
import com.forja.api.entity.LabProject;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(name = "LabProject")
public record LabProjectResponse(Long id, String name, String description, LabMode mode, String content,
		Instant updatedAt) {

	public static LabProjectResponse of(LabProject project) {
		return new LabProjectResponse(project.getId(), project.getName(), project.getDescription(), project.getMode(),
				project.getContent(), project.getUpdatedAt());
	}

}
