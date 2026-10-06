package com.forja.api.content;

import com.forja.api.content.ModuleManifest.LessonEntry;
import com.forja.api.entity.CourseModule;
import com.forja.api.entity.Exercise;
import com.forja.api.entity.Exercise.TestCaseData;
import com.forja.api.entity.Lesson;
import com.forja.api.repository.ExerciseRepository;
import com.forja.api.repository.LessonRepository;
import com.forja.api.repository.ModuleRepository;
import com.forja.api.util.SlugRules;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.dataformat.yaml.YAMLMapper;

/**
 * Synchronises the learning content in {@code resources/content} into the
 * database at start-up. The files are the source of truth for lessons and
 * exercises; the catalog (languages, courses, modules) still comes from the
 * Flyway migrations.
 *
 * <pre>
 * content/&lt;course-slug&gt;/&lt;NN&gt;-&lt;module-slug&gt;/
 *     module.yml       lessons (slug, title, summary, minutes) and exercise slugs, in order
 *     &lt;lesson&gt;.md      lesson body in CommonMark
 *     &lt;exercise&gt;.yml   statement, starter code, solution, hints and tests
 * </pre>
 *
 * Lessons and exercises are matched by slug and updated in place, so progress
 * that refers to them survives edits. Removed ones are unpublished, not
 * deleted. A module with content becomes published.
 */
@Component
@ConditionalOnProperty(name = "forja.content.import-on-startup", havingValue = "true", matchIfMissing = true)
public class ContentImporter implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(ContentImporter.class);

	private static final String MANIFESTS = "classpath*:content/*/*/module.yml";

	/** {@code .../content/java-desde-cero/02-variables/module.yml} → course and module slugs. */
	private static final Pattern MODULE_PATH = Pattern
		.compile("content/([a-z0-9-]+)/\\d+-([a-z0-9-]+)/module\\.yml$");

	private static final int MAX_TEST_CASES = 12;

	private final ModuleRepository moduleRepository;

	private final LessonRepository lessonRepository;

	private final ExerciseRepository exerciseRepository;

	private final YAMLMapper yamlMapper = YAMLMapper.builder()
		.enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
		.build();

	public ContentImporter(ModuleRepository moduleRepository, LessonRepository lessonRepository,
			ExerciseRepository exerciseRepository) {
		this.moduleRepository = moduleRepository;
		this.lessonRepository = lessonRepository;
		this.exerciseRepository = exerciseRepository;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) throws IOException {
		Resource[] manifests = new PathMatchingResourcePatternResolver().getResources(MANIFESTS);
		Set<String> exerciseSlugs = new HashSet<>();
		int lessons = 0;
		int exercises = 0;
		for (Resource manifest : manifests) {
			Matcher path = MODULE_PATH.matcher(manifest.getURL().toString());
			if (!path.find()) {
				throw new IllegalStateException("Unexpected content location: " + manifest.getURL());
			}
			CourseModule module = moduleRepository.findByCourseSlugAndSlug(path.group(1), path.group(2))
				.orElseThrow(() -> new IllegalStateException("Content for unknown module %s/%s".formatted(
						path.group(1), path.group(2))));
			ModuleManifest moduleManifest = read(manifest, ModuleManifest.class);
			lessons += importLessons(module, manifest, moduleManifest.lessons());
			exercises += importExercises(module, manifest, moduleManifest.exercises(), exerciseSlugs);
			module.publish();
		}
		log.info("Content imported: {} modules, {} lessons, {} exercises", manifests.length, lessons, exercises);
	}

	private int importLessons(CourseModule module, Resource manifest, List<LessonEntry> entries) throws IOException {
		Map<String, Lesson> existing = new HashMap<>();
		lessonRepository.findByModuleId(module.getId()).forEach(lesson -> existing.put(lesson.getSlug(), lesson));
		List<LessonEntry> lessons = entries == null ? List.of() : entries;

		for (int i = 0; i < lessons.size(); i++) {
			LessonEntry entry = lessons.get(i);
			requireSlug(entry.slug(), manifest);
			requireText(entry.title(), "title of lesson " + entry.slug());
			requireText(entry.summary(), "summary of lesson " + entry.slug());
			if (entry.minutes() <= 0) {
				throw new IllegalStateException("Lesson %s needs a positive 'minutes'".formatted(entry.slug()));
			}
			String body = text(manifest.createRelative(entry.slug() + ".md"));
			Lesson lesson = existing.remove(entry.slug());
			boolean created = lesson == null;
			if (created) {
				lesson = new Lesson(module, entry.slug());
			}
			lesson.update(entry.title(), entry.summary(), body, entry.minutes(), i + 1);
			if (created) {
				// Saved only once filled in: identity ids make Hibernate insert immediately.
				lessonRepository.save(lesson);
			}
		}
		existing.values().forEach(Lesson::unpublish);
		return lessons.size();
	}

	private int importExercises(CourseModule module, Resource manifest, List<String> slugs, Set<String> seen)
			throws IOException {
		Map<String, Exercise> existing = new HashMap<>();
		exerciseRepository.findByModuleId(module.getId())
			.forEach(exercise -> existing.put(exercise.getSlug(), exercise));
		List<String> exercises = slugs == null ? List.of() : slugs;

		for (int i = 0; i < exercises.size(); i++) {
			String slug = exercises.get(i);
			requireSlug(slug, manifest);
			if (!seen.add(slug)) {
				throw new IllegalStateException("Exercise slug '%s' is used twice; slugs are global".formatted(slug));
			}
			ExerciseFile file = read(manifest.createRelative(slug + ".yml"), ExerciseFile.class);
			validate(slug, file);

			Exercise exercise = existing.remove(slug);
			if (exercise == null) {
				// It may be moving here from another module.
				exercise = exerciseRepository.findBySlug(slug).orElse(null);
			}
			boolean created = exercise == null;
			if (created) {
				exercise = new Exercise(module, slug);
			}
			exercise.update(module, file.title().strip(), file.summary().strip(), file.difficulty(),
					file.statement(), file.starter(), file.solution(), i + 1);
			exercise.replaceTestCases(file.tests()
				.stream()
				.map(test -> new TestCaseData(Objects.requireNonNullElse(test.input(), ""), test.output(),
						test.isSample()))
				.toList());
			exercise.replaceHints(file.hints() == null ? List.of() : file.hints().stream().map(String::strip).toList());
			if (created) {
				exerciseRepository.save(exercise);
			}
		}
		existing.values().forEach(Exercise::unpublish);
		return exercises.size();
	}

	private static void validate(String slug, ExerciseFile file) {
		requireText(file.title(), "title of exercise " + slug);
		requireText(file.summary(), "summary of exercise " + slug);
		requireText(file.statement(), "statement of exercise " + slug);
		requireText(file.starter(), "starter of exercise " + slug);
		requireText(file.solution(), "solution of exercise " + slug);
		if (file.difficulty() == null) {
			throw new IllegalStateException("Exercise %s needs a difficulty".formatted(slug));
		}
		if (file.tests() == null || file.tests().isEmpty() || file.tests().size() > MAX_TEST_CASES) {
			throw new IllegalStateException("Exercise %s needs between 1 and %d tests".formatted(slug, MAX_TEST_CASES));
		}
		if (file.tests().stream().noneMatch(ExerciseFile.TestEntry::isSample)) {
			throw new IllegalStateException("Exercise %s needs at least one sample test".formatted(slug));
		}
		if (file.tests().stream().anyMatch(test -> test.output() == null)) {
			throw new IllegalStateException("Every test of exercise %s needs an output".formatted(slug));
		}
	}

	private static void requireSlug(String slug, Resource manifest) {
		if (slug == null || !slug.matches(SlugRules.PATTERN)) {
			throw new IllegalStateException("Invalid slug '%s' in %s".formatted(slug, manifest.getDescription()));
		}
	}

	private static void requireText(String value, String what) {
		if (value == null || value.isBlank()) {
			throw new IllegalStateException("Missing " + what);
		}
	}

	private <T> T read(Resource resource, Class<T> type) {
		try (InputStream input = resource.getInputStream()) {
			return yamlMapper.readValue(input, type);
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Cannot read " + resource.getDescription(), ex);
		}
	}

	private static String text(Resource resource) {
		try (InputStream input = resource.getInputStream()) {
			return new String(input.readAllBytes(), StandardCharsets.UTF_8);
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Cannot read " + resource.getDescription(), ex);
		}
	}

}
