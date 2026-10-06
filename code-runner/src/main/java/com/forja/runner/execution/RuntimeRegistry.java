package com.forja.runner.execution;

import com.forja.runner.config.RunnerProperties;
import com.forja.runner.config.RuntimeProperties;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/** The languages this runner can execute. Built from configuration at start-up. */
@Component
public class RuntimeRegistry {

	private final Map<String, LanguageRuntime> runtimes;

	public RuntimeRegistry(RunnerProperties properties, List<SourceLayout> layouts) {
		Map<String, SourceLayout> layoutsByName = layouts.stream()
			.collect(Collectors.toMap(SourceLayout::name, Function.identity()));
		this.runtimes = properties.runtimes()
			.entrySet()
			.stream()
			.collect(Collectors.toUnmodifiableMap(Map.Entry::getKey,
					entry -> toRuntime(entry.getKey(), entry.getValue(), layoutsByName)));
	}

	public Optional<LanguageRuntime> find(String language) {
		return Optional.ofNullable(runtimes.get(language));
	}

	public List<LanguageRuntime> all() {
		return List.copyOf(runtimes.values());
	}

	private static LanguageRuntime toRuntime(String language, RuntimeProperties properties,
			Map<String, SourceLayout> layoutsByName) {
		SourceLayout layout = layoutsByName.get(properties.layout());
		if (layout == null) {
			throw new IllegalStateException(
					"Runtime '%s' uses unknown layout '%s'".formatted(language, properties.layout()));
		}
		return new LanguageRuntime(language, properties, layout);
	}

}
