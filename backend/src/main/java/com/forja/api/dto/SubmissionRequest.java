package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

@Schema(name = "SubmissionRequest", description = "The program, or for FILL and PARSONS exercises the parts that complete it.")
public record SubmissionRequest(
		@Schema(description = "The program; for PREDICT, the output the learner expects.") @Size(max = 65536,
				message = "admite hasta 64 KB") String sourceCode,
		@Schema(description = "FILL: the answer of each blank. PARSONS: the chosen lines, in order.") @Size(max = 200,
				message = "admite hasta 200 partes") List<@NotNull(message = "no puede ser nulo") @Size(max = 2000,
						message = "admite hasta 2000 caracteres") String> parts) {

	public SubmissionRequest(String sourceCode) {
		this(sourceCode, null);
	}

}
