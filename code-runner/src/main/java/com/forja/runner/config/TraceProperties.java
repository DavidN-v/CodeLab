package com.forja.runner.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.util.unit.DataSize;

/**
 * How a runtime runs a program step by step for the visualizer.
 *
 * @param command shell command that runs {@code $FORJA_MAIN} under the tracer
 * and prints the trace as JSON on stdout
 * @param timeout wall-clock limit for the traced run; tracing is slower than
 * running
 * @param output largest trace accepted
 */
public record TraceProperties(@NotBlank String command, @NotNull Duration timeout, @NotNull DataSize output) {
}
