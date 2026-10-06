package com.forja.api.security;

import com.forja.api.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/** Answers unauthenticated requests with a JSON 401 instead of a login redirect. */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

	private final ApiErrorWriter apiErrorWriter;

	public RestAuthenticationEntryPoint(ApiErrorWriter apiErrorWriter) {
		this.apiErrorWriter = apiErrorWriter;
	}

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException authException) throws IOException {
		apiErrorWriter.write(request, response, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
	}

}
