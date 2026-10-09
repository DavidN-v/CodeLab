package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

@Schema(name = "AuthResponse", description = "A bearer token for the Authorization header and who it belongs to.")
public record AuthResponse(String token, Instant expiresAt, UserResponse user) {
}
