package com.forja.api.security;

import com.forja.api.config.JwtProperties;
import com.forja.api.entity.User;
import java.time.Clock;
import java.time.Instant;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

/** Issues the access tokens the resource server verifies on every request. */
@Component
public class TokenService {

	public record IssuedToken(String value, Instant expiresAt) {
	}

	private final JwtEncoder jwtEncoder;

	private final JwtProperties properties;

	private final Clock clock;

	public TokenService(JwtEncoder jwtEncoder, JwtProperties properties, Clock clock) {
		this.jwtEncoder = jwtEncoder;
		this.properties = properties;
		this.clock = clock;
	}

	public IssuedToken issue(User user) {
		Instant now = clock.instant();
		Instant expiresAt = now.plus(properties.ttl());
		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer(properties.issuer())
			.subject(user.getId().toString())
			.issuedAt(now)
			.expiresAt(expiresAt)
			.claim("name", user.getDisplayName())
			.claim("scope", user.getRole().name().toLowerCase())
			.build();
		String token = jwtEncoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
			.getTokenValue();
		return new IssuedToken(token, expiresAt);
	}

}
