package com.forja.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.forja.api.config.JwtConfig;
import com.forja.api.config.SecurityConfig;
import com.forja.api.dto.LabProjectResponse;
import com.forja.api.entity.LabMode;
import com.forja.api.exception.GlobalExceptionHandler;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.security.ApiErrorWriter;
import com.forja.api.security.RestAccessDeniedHandler;
import com.forja.api.security.RestAuthenticationEntryPoint;
import com.forja.api.service.LabProjectService;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = LabProjectController.class,
		excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@Import({ SecurityConfig.class, JwtConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
		ApiErrorWriter.class, GlobalExceptionHandler.class })
class LabProjectControllerTest {

	private static final String BODY = "{\"name\": \"Calculadora\", \"description\": \"\", \"mode\": \"FREE\", "
			+ "\"content\": \"{}\"}";

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private LabProjectService service;

	@Test
	void projectsAreNotPublic() throws Exception {
		mockMvc.perform(get("/api/lab/projects")).andExpect(status().isUnauthorized());
		mockMvc.perform(post("/api/lab/projects").contentType(MediaType.APPLICATION_JSON).content(BODY))
			.andExpect(status().isUnauthorized());
		verifyNoInteractions(service);
	}

	@Test
	void createsTheProjectForTheLearnerInTheToken() throws Exception {
		when(service.create(eq(7L), any()))
			.thenReturn(new LabProjectResponse(1L, "Calculadora", "", LabMode.FREE, "{}", Instant.EPOCH));

		mockMvc.perform(post("/api/lab/projects").with(jwt().jwt(token -> token.subject("7")))
			.contentType(MediaType.APPLICATION_JSON)
			.content(BODY)).andExpect(status().isCreated()).andExpect(jsonPath("$.id").value(1));
	}

	@Test
	void anotherLearnersProjectLooksMissing() throws Exception {
		when(service.get(8L, 1L)).thenThrow(new ResourceNotFoundException("No existe el proyecto con id 1."));

		mockMvc.perform(get("/api/lab/projects/1").with(jwt().jwt(token -> token.subject("8"))))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"));
	}

	@Test
	void rejectsAProjectWithoutAName() throws Exception {
		mockMvc.perform(post("/api/lab/projects").with(jwt().jwt(token -> token.subject("7")))
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"name\": \" \", \"mode\": \"FREE\", \"content\": \"{}\"}")).andExpect(status().isBadRequest());
		verifyNoInteractions(service);
	}

	@Test
	void deletesOnlyThroughTheOwner() throws Exception {
		mockMvc.perform(delete("/api/lab/projects/3").with(jwt().jwt(token -> token.subject("7"))))
			.andExpect(status().isNoContent());
		verify(service).delete(7L, 3L);
	}

}
