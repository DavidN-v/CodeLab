package com.forja.runner.execution;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * @param language slug of a configured runtime that supports tracing
 * @param sourceCode the complete program
 * @param stdin what the program reads from standard input
 */
public record TraceRequest(@NotBlank String language, @NotNull String sourceCode, @NotNull String stdin) {
}
