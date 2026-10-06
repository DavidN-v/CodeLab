package com.forja.api.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param secret HMAC key that signs the access tokens; at least 32 bytes
 * @param ttl how long an access token stays valid
 * @param issuer value of the {@code iss} claim
 */
@ConfigurationProperties("forja.security.jwt")
public record JwtProperties(String secret, Duration ttl, String issuer) {
}
