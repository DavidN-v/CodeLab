package com.forja.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	@Bean
	OpenAPI forjaOpenApi() {
		return new OpenAPI().info(new Info().title("Forja API")
			.version("v1")
			.description("REST API of the Forja learning platform: catalog, progress, code execution and tutoring. "
					+ "Every error response uses the ApiError schema."));
	}

}
