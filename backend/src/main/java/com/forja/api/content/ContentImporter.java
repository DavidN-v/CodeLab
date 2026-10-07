package com.forja.api.content;

import com.forja.api.content.ModuleManifest.LessonEntry;
import com.forja.api.dto.QuizQuestionResponse;
import com.forja.api.entity.Course;
import com.forja.api.entity.CourseModule;
import com.forja.api.entity.Exercise;
import com.forja.api.entity.Exercise.TestCaseData;
import com.forja.api.entity.ExerciseKind;
import com.forja.api.entity.GlossaryTerm;
import com.forja.api.entity.Lesson;
import com.forja.api.learning.OutputComparator;
import com.forja.api.learning.ParsonsPuzzle;
import com.forja.api.repository.CourseRepository;
import com.forja.api.repository.ExerciseRepository;
import com.forja.api.repository.GlossaryTermRepository;
import com.forja.api.repository.LessonRepository;
import com.forja.api.repository.ModuleRepository;
import com.forja.api.util.SlugRules;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
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
import tools.jackson.databind.json.JsonMapper;
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
 *     &lt;lesson&gt;.quiz.yml optional questions at the end of the lesson
 *     &lt;exercise&gt;.yml   statement, starter code, solution, hints and tests
 * content/&lt;course-slug&gt;/glossary.yml   optional glossary of the course
 * </pre>
 *
 * The format is described in docs/CONTENT.md.
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

	private static final String GLOSSARIES = "classpath*:content/*/glossary.yml";

	private static final Pattern GLOSSARY_PATH = Pattern.compile("content/([a-z0-9-]+)/glossary\\.yml$");

	/** {@code .../content/java-desde-cero/02-variables/module.yml} → course and module slugs. */
	private static final Pattern MODULE_PATH = Pattern
		.compile("content/([a-z0-9-]+)/\\d+-([a-z0-9-]+)/module\\.yml$");

	private static final int MAX_TEST_CASES = 12;

	private final ModuleRepository moduleRepository;

	private final LessonRepository lessonRepository;

	private final ExerciseRepository exerciseRepository;

	private final CourseRepository courseRepository;

	private final GlossaryTermRepository glossaryRepository;

	private final JsonMapper jsonMapper = JsonMapper.builder().build();

	private final YAMLMapper yamlMapper = YAMLMapper.builder()
		.enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
		.build();

	public ContentImporter(ModuleRepository moduleRepository, LessonRepository lessonRepository,
			ExerciseRepository exerciseRepository, CourseRepository courseRepository,
			GlossaryTermRepository glossaryRepository) {
		this.moduleRepository = moduleRepository;
		this.lessonRepository = lessonRepository;
		this.exerciseRepository = exerciseRepository;
		this.courseRepository = courseRepository;
		this.glossaryRepository = glossaryRepository;
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
		int terms = 0;
		for (Resource glossary : new PathMatchingResourcePatternResolver().getResources(GLOSSARIES)) {
			terms += importGlossary(glossary);
		}
		log.info("Content imported: {} modules, {} lessons, {} exercises, {} glossary terms", manifests.length,
				lessons, exercises, terms);
	}

	private int importGlossary(Resource resource) throws IOException {
		Matcher path = GLOSSARY_PATH.matcher(resource.getURL().toString());
		if (!path.find()) {
			throw new IllegalStateException("Unexpected glossary location: " + resource.getURL());
		}
		Course course = courseRepository.findBySlug(path.group(1))
			.orElseThrow(() -> new IllegalStateException("Glossary for unknown course " + path.group(1)));
		GlossaryFile file = read(resource, GlossaryFile.class);
		Map<String, GlossaryTerm> existing = new HashMap<>();
		glossaryRepository.findByCourseId(course.getId()).forEach(term -> existing.put(term.getTerm(), term));
		List<GlossaryFile.Entry> entries = file.terms() == null ? List.of() : file.terms();
		for (int i = 0; i < entries.size(); i++) {
			GlossaryFile.Entry entry = entries.get(i);
			requireText(entry.term(), "glossary term");
			requireText(entry.definition(), "definition of " + entry.term());
			String term = entry.term().strip();
			GlossaryTerm glossaryTerm = existing.remove(term);
			boolean created = glossaryTerm == null;
			if (created) {
				glossaryTerm = new GlossaryTerm(course, term);
			}
			List<String> aliases = entry.aliases() == null ? List.of()
					: entry.aliases().stream().map(String::strip).toList();
			glossaryTerm.update(jsonMapper.writeValueAsString(aliases), entry.definition().strip(), i + 1);
			if (created) {
				glossaryRepository.save(glossaryTerm);
			}
		}
		glossaryRepository.deleteAll(existing.values());
		return entries.size();
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
			Resource quizFile = manifest.createRelative(entry.slug() + ".quiz.yml");
			String quiz = quizFile.exists() ? quizJson(entry.slug(), read(quizFile, QuizFile.class)) : null;
			Lesson lesson = existing.remove(entry.slug());
			boolean created = lesson == null;
			if (created) {
				lesson = new Lesson(module, entry.slug());
			}
			lesson.update(entry.title(), entry.summary(), body, quiz, entry.minutes(), i + 1);
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
			ExerciseKind kind = kindOf(slug, file);
			validate(slug, kind, file);
			String solution = kind == ExerciseKind.PREDICT && file.solution() == null ? file.tests().get(0).output()
					: file.solution();
			String parsons = kind == ExerciseKind.PARSONS ? jsonMapper.writeValueAsString(
					new ParsonsPuzzle.Data(file.lines(), file.distractors() == null ? List.of() : file.distractors()))
					: null;

			Exercise exercise = existing.remove(slug);
			if (exercise == null) {
				// It may be moving here from another module.
				exercise = exerciseRepository.findBySlug(slug).orElse(null);
			}
			boolean created = exercise == null;
			if (created) {
				exercise = new Exercise(module, slug);
			}
			exercise.update(module, file.title().strip(), file.summary().strip(), file.difficulty(), kind,
					file.statement(), file.starter(), solution, parsons, i + 1);
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

	private static ExerciseKind kindOf(String slug, ExerciseFile file) {
		String kind = file.kind() == null ? "code" : file.kind().strip();
		try {
			return ExerciseKind.valueOf(kind.toUpperCase(Locale.ROOT));
		}
		catch (IllegalArgumentException ex) {
			throw new IllegalStateException("Exercise %s has unknown kind '%s'".formatted(slug, kind), ex);
		}
	}

	private static void validate(String slug, ExerciseKind kind, ExerciseFile file) {
		requireText(file.title(), "title of exercise " + slug);
		requireText(file.summary(), "summary of exercise " + slug);
		requireText(file.statement(), "statement of exercise " + slug);
		requireText(file.starter(), "starter of exercise " + slug);
		if (kind != ExerciseKind.PREDICT) {
			requireText(file.solution(), "solution of exercise " + slug);
		}
		if (file.difficulty() == null) {
			throw new IllegalStateException("Exercise %s needs a difficulty".formatted(slug));
		}
		if (file.tests() == null || file.tests().isEmpty() || file.tests().size() > MAX_TEST_CASES) {
			throw new IllegalStateException("Exercise %s needs between 1 and %d tests".formatted(slug, MAX_TEST_CASES));
		}
		if (kind != ExerciseKind.PREDICT && file.tests().stream().noneMatch(ExerciseFile.TestEntry::isSample)) {
			throw new IllegalStateException("Exercise %s needs at least one sample test".formatted(slug));
		}
		if (file.tests().stream().anyMatch(test -> test.output() == null)) {
			throw new IllegalStateException("Every test of exercise %s needs an output".formatted(slug));
		}
		switch (kind) {
			case FILL -> {
				int blanks = ContentTemplates.countBlanks(file.starter());
				if (blanks == 0 || file.answers() == null || file.answers().size() != blanks) {
					throw new IllegalStateException(
							"Fill exercise %s needs one answer per blank %s".formatted(slug, ContentTemplates.BLANK));
				}
				if (!OutputComparator.matches(file.solution(), ContentTemplates.fill(file.starter(), file.answers()))) {
					throw new IllegalStateException(
							"Fill exercise %s: the starter with its answers is not the solution".formatted(slug));
				}
			}
			case PARSONS -> {
				if (ContentTemplates.countLinesMarkers(file.starter()) != 1 || file.lines() == null
						|| file.lines().size() < 3) {
					throw new IllegalStateException("Parsons exercise %s needs one %s line and at least 3 lines"
						.formatted(slug, ContentTemplates.LINES));
				}
				if (!OutputComparator.matches(file.solution(), ContentTemplates.assemble(file.starter(), file.lines()))) {
					throw new IllegalStateException(
							"Parsons exercise %s: the starter with its lines is not the solution".formatted(slug));
				}
			}
			default -> {
			}
		}
	}

	private String quizJson(String lessonSlug, QuizFile file) {
		if (file.questions() == null || file.questions().isEmpty()) {
			throw new IllegalStateException("The quiz of lesson %s has no questions".formatted(lessonSlug));
		}
		List<QuizQuestionResponse> questions = new ArrayList<>();
		for (QuizFile.Entry entry : file.questions()) {
			String where = "a question of the quiz of lesson " + lessonSlug;
			requireText(entry.prompt(), "prompt of " + where);
			requireText(entry.explanation(), "explanation of " + where);
			String type = entry.type() == null ? "" : entry.type().strip();
			if (type.equals("choice")) {
				if (entry.options() == null || entry.options().size() < 2
						|| !(entry.answer() instanceof Integer answer) || answer < 0
						|| answer >= entry.options().size()) {
					throw new IllegalStateException("Invalid options or answer in " + where);
				}
				questions.add(new QuizQuestionResponse("CHOICE", entry.prompt().strip(), entry.code(),
						entry.options().stream().map(String::strip).toList(), answer, null, null,
						entry.explanation().strip()));
			}
			else if (type.equals("output")) {
				requireText(entry.code(), "code of " + where);
				if (!(entry.answer() instanceof String expected)) {
					throw new IllegalStateException("The answer of %s must be the text printed".formatted(where));
				}
				questions.add(new QuizQuestionResponse("OUTPUT", entry.prompt().strip(), entry.code(), null, null,
						expected, entry.input() == null ? "" : entry.input(), entry.explanation().strip()));
			}
			else {
				throw new IllegalStateException("Unknown type '%s' in %s".formatted(type, where));
			}
		}
		return jsonMapper.writeValueAsString(questions);
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
