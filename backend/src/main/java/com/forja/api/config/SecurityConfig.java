package com.forja.api.config;

import com.forja.api.security.RestAccessDeniedHandler;
import com.forja.api.security.RestAuthenticationEntryPoint;
import java.util.List;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Stateless API security. The public catalog is readable by anyone; everything
 * else requires authentication. No authentication mechanism is registered yet,
 * so protected routes answer 401 until the JWT filter is added.
 */
@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(CorsProperties.class)
public class SecurityConfig {

	private static final String[] PUBLIC_DOCUMENTATION = { "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html" };

	private static final String[] PUBLIC_CATALOG = { "/api/languages/**", "/api/courses/**" };

	@Bean
	SecurityFilterChain apiSecurityFilterChain(HttpSecurity http, RestAuthenticationEntryPoint authenticationEntryPoint,
			RestAccessDeniedHandler accessDeniedHandler) throws Exception {
		return http
			// Safe to disable: no session cookies, so there is nothing for CSRF to ride on.
			.csrf(AbstractHttpConfigurer::disable)
			.cors(Customizer.withDefaults())
			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.exceptionHandling(handling -> handling.authenticationEntryPoint(authenticationEntryPoint)
				.accessDeniedHandler(accessDeniedHandler))
			.authorizeHttpRequests(requests -> requests.requestMatchers("/actuator/health/**")
				.permitAll()
				.requestMatchers(PUBLIC_DOCUMENTATION)
				.permitAll()
				.requestMatchers(HttpMethod.GET, PUBLIC_CATALOG)
				.permitAll()
				.anyRequest()
				.authenticated())
			.build();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource(CorsProperties corsProperties) {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(corsProperties.allowedOrigins());
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE, HttpHeaders.ACCEPT));
		configuration.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", configuration);
		return source;
	}

}
