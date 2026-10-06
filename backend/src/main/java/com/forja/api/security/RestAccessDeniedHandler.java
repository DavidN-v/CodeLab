package com.forja.api.security;

import com.forja.api.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

/** Answers authenticated requests that lack permission with a JSON 403. */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

	private final ApiErrorWriter apiErrorWriter;

	public RestAccessDeniedHandler(ApiErrorWriter apiErrorWriter) {
		this.apiErrorWriter = apiErrorWriter;
	}

	@Override
	public void handle(HttpServletRequest request, HttpServletResponse response,
			AccessDeniedException accessDeniedException) throws IOException {
		apiErrorWriter.write(request, response, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN);
	}

}
