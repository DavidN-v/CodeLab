package com.forja.api.content;

import static org.assertj.core.api.Assertions.assertThat;

import com.forja.api.learning.OutputComparator;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.dataformat.yaml.YAMLMapper;

/**
 * Runs the course content through a real code-runner: every exercise's
 * solution must pass all its tests (for a prediction, the program shown must
 * print the expected output), every starter of a code exercise must compile,
 * every lesson example with a main method must compile (examples fenced as
 * {@code java error} are meant to fail and are skipped) and every quiz
 * question about a program's output must match what it prints.
 * {@code tools/verify_content.py} runs the same checks, and a few more, faster.
 *
 * <p>Needs a running code-runner, so it only runs when {@code FORJA_RUNNER_URL}
 * is set, e.g. {@code FORJA_RUNNER_URL=http://localhost:8090 ./mvnw test
 * -Dtest=ContentVerificationTest}.
 */
@EnabledIfEnvironmentVariable(named = "FORJA_RUNNER_URL", matches = ".+")
class ContentVerificationTest {

	private static final Path CONTENT = Path.of("src/main/resources/content");

	private static final Pattern JAVA_BLOCK = Pattern.compile("(?ms)^```java[ \\t]*\\n(.*?)^```");

	private final HttpClient http = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build();

	private final JsonMapper json = JsonMapper.builder().build();

	private final YAMLMapper yaml = YAMLMapper.builder()
		.enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
		.build();

	private final URI runner = URI.create(System.getenv("FORJA_RUNNER_URL")).resolve("/internal/executions");

	@Test
	void solutionsPassStartersCompileAndExamplesCompile() throws Exception {
		List<String> problems = Collections.synchronizedList(new ArrayList<>());
		List<Runnable> checks = new ArrayList<>();

		try (Stream<Path> manifests = Files.walk(CONTENT)) {
			for (Path manifest : manifests.filter(path -> path.endsWith("module.yml")).sorted().toList()) {
				Path module = manifest.getParent();
				ModuleManifest moduleManifest = yaml.readValue(manifest.toFile(), ModuleManifest.class);
				for (String slug : moduleManifest.exercises()) {
					ExerciseFile exercise = yaml.readValue(module.resolve(slug + ".yml").toFile(), ExerciseFile.class);
					String kind = exercise.kind() == null ? "code" : exercise.kind();
					String program = kind.equals("predict") ? exercise.starter() : exercise.solution();
					checks.add(() -> checkPasses(slug, program, exercise.tests(), problems));
					if (kind.equals("code") || kind.equals("project")) {
						checks.add(() -> checkCompiles("starter of " + slug, exercise.starter(), problems));
					}
				}
				for (ModuleManifest.LessonEntry lesson : moduleManifest.lessons()) {
					Path quizFile = module.resolve(lesson.slug() + ".quiz.yml");
					if (Files.exists(quizFile)) {
						QuizFile quiz = yaml.readValue(quizFile.toFile(), QuizFile.class);
						int number = 0;
						for (QuizFile.Entry question : quiz.questions()) {
							number++;
							if ("output".equals(question.type())) {
								String name = "%s/%s quiz %d".formatted(module.getFileName(), lesson.slug(), number);
								ExerciseFile.TestEntry test = new ExerciseFile.TestEntry(question.input(),
										(String) question.answer(), true);
								checks.add(() -> checkPasses(name, question.code(), List.of(test), problems));
							}
						}
					}
					String markdown = Files.readString(module.resolve(lesson.slug() + ".md"));
					Matcher block = JAVA_BLOCK.matcher(markdown);
					int index = 0;
					while (block.find()) {
						index++;
						String code = block.group(1);
						if (code.contains("static void main")) {
							String name = "%s/%s example %d".formatted(module.getFileName(), lesson.slug(), index);
							checks.add(() -> checkCompiles(name, code, problems));
						}
					}
				}
			}
		}

		int parallelism = Integer.parseInt(Objects.requireNonNullElse(System.getenv("FORJA_RUNNER_PARALLELISM"), "4"));
		try (ExecutorService executor = Executors.newFixedThreadPool(parallelism)) {
			List<Future<?>> futures = checks.stream().map(executor::submit).toList();
			for (Future<?> future : futures) {
				future.get();
			}
		}
		assertThat(problems).as("%d checks", checks.size()).isEmpty();
	}

	private void checkPasses(String slug, String program, List<ExerciseFile.TestEntry> tests, List<String> problems) {
		List<String> inputs = tests.stream().map(test -> Objects.requireNonNullElse(test.input(), "")).toList();
		JsonNode result = execute(program, inputs);
		if (result == null) {
			problems.add(slug + ": runner request failed");
			return;
		}
		if (!result.get("compile").get("success").asBoolean()) {
			problems.add(slug + ": solution does not compile\n" + result.get("compile").get("output").asString());
			return;
		}
		JsonNode runs = result.get("runs");
		for (int i = 0; i < tests.size(); i++) {
			if (i >= runs.size()) {
				problems.add("%s: test %d did not run".formatted(slug, i + 1));
				continue;
			}
			JsonNode run = runs.get(i);
			String expected = tests.get(i).output();
			String actual = run.get("stdout").asString();
			if (run.get("exitCode").asInt() != 0 || !OutputComparator.matches(expected, actual)) {
				problems.add("%s: test %d failed (exit %d)%n--- expected%n%s--- actual%n%s--- stderr%n%s".formatted(slug,
						i + 1, run.get("exitCode").asInt(), expected, actual, run.get("stderr").asString()));
			}
		}
	}

	private void checkCompiles(String name, String code, List<String> problems) {
		JsonNode result = execute(code, List.of(""));
		if (result == null) {
			problems.add(name + ": runner request failed");
		}
		else if (!result.get("compile").get("success").asBoolean()) {
			problems.add(name + ": does not compile\n" + result.get("compile").get("output").asString());
		}
	}

	private JsonNode execute(String code, List<String> inputs) {
		try {
			String body = json.writeValueAsString(Map.of("language", "java", "sourceCode", code, "inputs", inputs));
			HttpRequest request = HttpRequest.newBuilder(runner)
				.timeout(Duration.ofMinutes(3))
				.header("Content-Type", "application/json")
				.POST(HttpRequest.BodyPublishers.ofString(body))
				.build();
			HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
			return response.statusCode() == 200 ? json.readTree(response.body()) : null;
		}
		catch (IOException ex) {
			return null;
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			return null;
		}
	}

}
