package com.forja.runner.execution;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * @param language slug of a configured runtime
 * @param sourceCode the complete program
 * @param inputs stdin for each run; the program runs once per entry, in order
 */
public record ExecutionRequest(@NotBlank String language, @NotNull String sourceCode,
		@NotEmpty List<@NotNull String> inputs) {
}
