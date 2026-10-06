package com.forja.api.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.forja.api.config.JwtConfig;
import com.forja.api.config.SecurityConfig;
import com.forja.api.dto.SubmissionResultResponse;
import com.forja.api.entity.SubmissionStatus;
import com.forja.api.security.ApiErrorWriter;
import com.forja.api.security.RestAccessDeniedHandler;
import com.forja.api.security.RestAuthenticationEntryPoint;
import com.forja.api.service.ExerciseService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = ExerciseController.class,
		excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@Import({ SecurityConfig.class, JwtConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
		ApiErrorWriter.class })
class ExerciseControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private ExerciseService exerciseService;

	@Test
	void submittingRequiresAToken() throws Exception {
		mockMvc.perform(post("/api/exercises/hola-mundo/submissions").contentType(MediaType.APPLICATION_JSON)
			.content("{\"sourceCode\": \"class A {}\"}"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
		verifyNoInteractions(exerciseService);
	}

	@Test
	void progressRoutesBelowAnExerciseAreNotPublic() throws Exception {
		mockMvc.perform(get("/api/exercises/hola-mundo/progress")).andExpect(status().isUnauthorized());
	}

	@Test
	void anInvalidTokenIsRejected() throws Exception {
		mockMvc.perform(get("/api/exercises/hola-mundo/progress").header("Authorization", "Bearer no-es-un-jwt"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
	}

	@Test
	void submitsForTheLearnerInTheToken() throws Exception {
		when(exerciseService.submit(eq(7L), eq("hola-mundo"), eq("class A {}"))).thenReturn(
				new SubmissionResultResponse(1L, SubmissionStatus.ACCEPTED, 1, 1, 40, null, List.of(), true, 20));

		mockMvc.perform(post("/api/exercises/hola-mundo/submissions").with(jwt().jwt(token -> token.subject("7")))
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"sourceCode\": \"class A {}\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("ACCEPTED"))
			.andExpect(jsonPath("$.xpAwarded").value(20));
	}

	@Test
	void rejectsAnEmptySubmission() throws Exception {
		mockMvc.perform(post("/api/exercises/hola-mundo/submissions").with(jwt().jwt(token -> token.subject("7")))
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"sourceCode\": \"   \"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
			.andExpect(jsonPath("$.fieldErrors[0].field").value("sourceCode"));
	}

}
