package com.forja.api.controller;

import com.forja.api.dto.ApiErrorResponse;
import com.forja.api.dto.LanguageResponse;
import com.forja.api.service.LanguageService;
import com.forja.api.util.SlugRules;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/languages")
@Tag(name = "Languages", description = "Languages and technologies offered by the platform.")
public class LanguageController {

	private final LanguageService languageService;

	public LanguageController(LanguageService languageService) {
		this.languageService = languageService;
	}

	@GetMapping
	@Operation(summary = "List languages",
			description = "Returns every language in display order. Languages with active=false are announced but have no content yet.")
	@ApiResponse(responseCode = "200", description = "Languages found.")
	public List<LanguageResponse> listLanguages() {
		return languageService.findAll();
	}

	@GetMapping("/{slug}")
	@Operation(summary = "Get a language by slug")
	@ApiResponse(responseCode = "200", description = "Language found.")
	@ApiResponse(responseCode = "400", description = "The slug is malformed.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	@ApiResponse(responseCode = "404", description = "No language has that slug.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public LanguageResponse getLanguage(@Parameter(description = "Language slug.", example = "java") @PathVariable
	@Pattern(regexp = SlugRules.PATTERN, message = SlugRules.MESSAGE) String slug) {
		return languageService.findBySlug(slug);
	}

}
