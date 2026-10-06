package com.forja.api.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.forja.api.config.SecurityConfig;
import com.forja.api.dto.LanguageResponse;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.security.ApiErrorWriter;
import com.forja.api.security.RestAccessDeniedHandler;
import com.forja.api.security.RestAuthenticationEntryPoint;
import com.forja.api.service.LanguageService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = LanguageController.class,
		excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@Import({ SecurityConfig.class, RestAuthenticationEntryPoint.class, RestAccessDeniedHandler.class,
		ApiErrorWriter.class })
class LanguageControllerTest {

	private static final LanguageResponse JAVA = new LanguageResponse(1L, "java", "Java", "21", "java",
			"Aprende Java.", null, true);

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private LanguageService languageService;

	@Test
	void listsLanguagesWithoutAuthentication() throws Exception {
		when(languageService.findAll()).thenReturn(List.of(JAVA));

		mockMvc.perform(get("/api/languages"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].slug").value("java"))
			.andExpect(jsonPath("$[0].active").value(true));
	}

	@Test
	void unknownLanguageReturnsTheStandardErrorBody() throws Exception {
		when(languageService.findBySlug("cobol"))
			.thenThrow(new ResourceNotFoundException("No existe el lenguaje 'cobol'."));

		mockMvc.perform(get("/api/languages/cobol"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.status").value(404))
			.andExpect(jsonPath("$.error").value("RESOURCE_NOT_FOUND"))
			.andExpect(jsonPath("$.message").value("No existe el lenguaje 'cobol'."))
			.andExpect(jsonPath("$.path").value("/api/languages/cobol"))
			.andExpect(jsonPath("$.timestamp").exists())
			.andExpect(jsonPath("$.fieldErrors").doesNotExist());
	}

	@Test
	void malformedSlugIsRejectedAsValidationError() throws Exception {
		mockMvc.perform(get("/api/languages/Not_A_Slug"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
			.andExpect(jsonPath("$.fieldErrors[0].field").value("slug"));
	}

	@Test
	void writeRequestsRequireAuthentication() throws Exception {
		mockMvc.perform(post("/api/languages"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
			.andExpect(jsonPath("$.path").value("/api/languages"));
	}

}
