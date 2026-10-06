package com.forja.runner.execution;

/**
 * Language-specific naming rules: the file the source must be saved as and the
 * entry point to run. Runtimes refer to a layout by {@link #name()}.
 */
public interface SourceLayout {

	String name();

	SourceFile resolve(String source);

}
