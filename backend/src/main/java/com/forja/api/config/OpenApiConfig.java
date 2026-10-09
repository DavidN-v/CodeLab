package com.forja.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	@Bean
	OpenAPI forjaOpenApi() {
		return new OpenAPI().info(new Info().title("Forja API")
			.version("v1")
			.description("REST API of the Forja learning platform: catalog, progress, code execution and tutoring. "
					+ "Every error response uses the ApiError schema."))
			.components(new Components().addSecuritySchemes("bearer",
					new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
	}

}
