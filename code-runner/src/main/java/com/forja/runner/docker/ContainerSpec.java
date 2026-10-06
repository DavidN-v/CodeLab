package com.forja.runner.docker;

import java.util.List;
import java.util.Map;

/**
 * The parts of a container definition the runner controls. Everything that
 * weakens isolation (networking, capabilities, writable root, privileges) is
 * fixed in {@link DockerClient#createContainer} rather than exposed here.
 *
 * @param image image to start
 * @param command process to run as PID 1
 * @param env environment variables as {@code NAME=value}
 * @param memoryBytes memory limit; swap is set to the same value, so none is used
 * @param nanoCpus CPU limit in billionths of a CPU
 * @param pidsLimit maximum processes and threads
 * @param tmpfs writable in-memory mounts: path to mount options
 */
public record ContainerSpec(String image, List<String> command, List<String> env, long memoryBytes, long nanoCpus,
		long pidsLimit, Map<String, String> tmpfs) {
}
