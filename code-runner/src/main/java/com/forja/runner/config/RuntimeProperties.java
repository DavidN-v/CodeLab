package com.forja.runner.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Everything the runner needs to execute one language. Adding a language is
 * adding one of these to the configuration, plus a {@code SourceLayout} if its
 * file naming rules are new.
 *
 * @param image sandbox image the program runs in
 * @param layout name of the {@code SourceLayout} that decides the file name and
 * entry point
 * @param compileCommand shell command that compiles {@code $FORJA_SOURCE_FILE}
 * into the {@code classes} directory; empty for interpreted languages
 * @param runCommand shell command that runs {@code $FORJA_MAIN}; it reads stdin
 * and writes stdout and stderr
 * @param limits resource limits applied to every execution
 * @param trace how to trace a run for the visualizer; null when the language
 * cannot be traced
 */
public record RuntimeProperties(@NotBlank String image, @NotBlank String layout, String compileCommand,
		@NotBlank String runCommand, @Valid @NotNull SandboxLimits limits, @Valid TraceProperties trace) {
}
