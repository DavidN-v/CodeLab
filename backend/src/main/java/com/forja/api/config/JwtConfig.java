package com.forja.api.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

/**
 * Signs and verifies access tokens with a shared HMAC secret. The API is the
 * only issuer and the only consumer, so an asymmetric key pair would add
 * nothing.
 */
@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtConfig {

	private static final int MINIMUM_SECRET_BYTES = 32;

	@Bean
	JwtEncoder jwtEncoder(JwtProperties properties) {
		return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey(properties)));
	}

	@Bean
	JwtDecoder jwtDecoder(JwtProperties properties) {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(secretKey(properties))
			.macAlgorithm(MacAlgorithm.HS256)
			.build();
		decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
				JwtValidators.createDefaultWithIssuer(properties.issuer())));
		return decoder;
	}

	private static SecretKey secretKey(JwtProperties properties) {
		byte[] secret = properties.secret() == null ? new byte[0]
				: properties.secret().getBytes(StandardCharsets.UTF_8);
		if (secret.length < MINIMUM_SECRET_BYTES) {
			throw new IllegalStateException(
					"JWT_SECRET must be set to a random value of at least %d characters".formatted(MINIMUM_SECRET_BYTES));
		}
		return new SecretKeySpec(secret, "HmacSHA256");
	}

}
