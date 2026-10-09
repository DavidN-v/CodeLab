package com.forja.runner.execution;

import com.forja.runner.config.RuntimeProperties;
import com.forja.runner.config.SandboxLimits;

/** A configured language, with its source layout resolved. */
public record LanguageRuntime(String language, RuntimeProperties properties, SourceLayout layout) {

	public SandboxLimits limits() {
		return properties.limits();
	}

}
