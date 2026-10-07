package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "TutorStatus")
public record TutorStatusResponse(@Schema(description = "Whether the AI tutor is configured on this server.") boolean enabled) {
}
