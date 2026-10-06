package com.forja.api.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param allowedOrigins origins allowed to call the API from a browser
 */
@ConfigurationProperties("forja.cors")
public record CorsProperties(List<String> allowedOrigins) {
}
