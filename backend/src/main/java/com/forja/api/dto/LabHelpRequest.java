package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Everything the tutor is allowed to rely on: the learner's goal, their files,
 * and what the real tools reported (diagnostics, console, tests). The three
 * evidence fields are produced by the browser tools, never by a model.
 */
@Schema(name = "LabHelpRequest")
public record LabHelpRequest(
		@Schema(description = "0 explains one problem in depth; 1 short hint; 2 the concept; 3 where to look; "
				+ "4 an example of the fix.") @Min(value = 0, message = "va de 0 a 4") @Max(value = 4,
						message = "va de 0 a 4") int level,
		@Size(max = 2000, message = "admite hasta 2000 caracteres") String idea,
		@Size(max = 4000, message = "admite hasta 4000 caracteres") String requirements,
		@NotEmpty(message = "necesita al menos un archivo") @Size(max = 20,
				message = "admite hasta 20 archivos") List<@Valid LabFileDto> files,
		@Size(max = 12_000, message = "admite hasta 12000 caracteres") String diagnostics,
		@Size(max = 8000, message = "admite hasta 8000 caracteres") String console,
		@Size(max = 8000, message = "admite hasta 8000 caracteres") String tests,
		@Schema(description = "The one problem to explain, or the file to fix.") @Size(max = 2000,
				message = "admite hasta 2000 caracteres") String focus,
		@Size(max = 1000, message = "admite hasta 1000 caracteres") String question) {
}
