package com.forja.runner.config;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.util.unit.DataSize;

/**
 * @param compileTimeout wall-clock limit for the compiler
 * @param runTimeout wall-clock limit for each run of the program
 * @param memory memory of the whole container; swap is disabled
 * @param cpus CPU share of the container
 * @param pids maximum processes and threads inside the container
 * @param output bytes kept of each stream (compiler output, stdout, stderr)
 * @param maxRuns runs allowed in one execution (one per input)
 * @param maxSource largest accepted source file
 * @param maxStdin largest accepted input per run
 * @param workspace size of the writable scratch space the program sees
 */
public record SandboxLimits(@NotNull Duration compileTimeout, @NotNull Duration runTimeout, @NotNull DataSize memory,
		@DecimalMin("0.1") double cpus, @Min(16) int pids, @NotNull DataSize output, @Min(1) int maxRuns,
		@NotNull DataSize maxSource, @NotNull DataSize maxStdin, @NotNull DataSize workspace) {
}
