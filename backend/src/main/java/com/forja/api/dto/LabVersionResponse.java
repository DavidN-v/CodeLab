package com.forja.api.dto;

import com.forja.api.entity.LabProjectVersion;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(name = "LabVersion")
public record LabVersionResponse(Long id, String label, Instant createdAt) {

	public static LabVersionResponse of(LabProjectVersion version) {
		return new LabVersionResponse(version.getId(), version.getLabel(), version.getCreatedAt());
	}

}
