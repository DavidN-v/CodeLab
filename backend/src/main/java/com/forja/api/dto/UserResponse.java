package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "User")
public record UserResponse(
		@Schema(example = "1") Long id,
		@Schema(example = "ada@example.com") String email,
		@Schema(example = "Ada") String displayName) {
}
