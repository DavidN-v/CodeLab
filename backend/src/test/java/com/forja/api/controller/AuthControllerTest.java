package com.forja.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.forja.api.config.JwtConfig;
import com.forja.api.config.SecurityConfig;
import com.forja.api.exception.ConflictException;
import com.forja.api.exception.InvalidCredentialsException;
import com.forja.api.security.ApiErrorWriter;
import com.forja.api.security.RestAccessDeniedHandler;
import com.forja.api.security.RestAuthenticationEntryPoint;
import com.forja.api.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = AuthController.class, excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@Import({ SecurityConfig.class, JwtConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
		ApiErrorWriter.class })
class AuthControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private AuthService authService;

	@Test
	void registrationValidatesEveryField() throws Exception {
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\": \"no-es-correo\", \"displayName\": \"\", \"password\": \"corta\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
			.andExpect(jsonPath("$.fieldErrors.length()").value(3));
	}

	@Test
	void aTakenEmailIsAConflict() throws Exception {
		when(authService.register(any())).thenThrow(new ConflictException("Ya existe una cuenta con ese correo."));

		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\": \"ada@example.com\", \"displayName\": \"Ada\", \"password\": \"una-contraseña\"}"))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.message").value("Ya existe una cuenta con ese correo."));
	}

	@Test
	void wrongCredentialsAnswer401WithAClearMessage() throws Exception {
		when(authService.login(any())).thenThrow(new InvalidCredentialsException());

		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\": \"ada@example.com\", \"password\": \"mala\"}"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
			.andExpect(jsonPath("$.message").value("El correo o la contraseña no son correctos."));
	}

}
