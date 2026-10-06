package com.forja.api.security;

import com.forja.api.dto.ApiErrorResponse;
import com.forja.api.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Writes an {@link ApiErrorResponse} straight to the servlet response. Needed
 * because security failures happen in the filter chain, before the request
 * reaches the MVC exception handler.
 */
@Component
public class ApiErrorWriter {

	private final ObjectMapper objectMapper;

	public ApiErrorWriter(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public void write(HttpServletRequest request, HttpServletResponse response, HttpStatus status, ErrorCode code)
			throws IOException {
		ApiErrorResponse error = ApiErrorResponse.of(status, code, code.defaultMessage(), request.getRequestURI());
		response.setStatus(status.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		objectMapper.writeValue(response.getOutputStream(), error);
	}

}
