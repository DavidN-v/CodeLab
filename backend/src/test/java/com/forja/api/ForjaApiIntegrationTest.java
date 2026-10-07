package com.forja.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.forja.api.client.CodeRunnerClient;
import com.forja.api.client.RunnerExecution;
import com.forja.api.entity.Exercise;
import com.forja.api.entity.ExerciseKind;
import com.forja.api.repository.ExerciseRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * The whole API against a real PostgreSQL: Flyway migrations, entity mappings
 * (Hibernate validates them), the content import and a learner's journey. Only
 * the code-runner is replaced, since it needs Docker-in-Docker.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ForjaApiIntegrationTest {

	@Container
	@ServiceConnection
	static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private ExerciseRepository exerciseRepository;

	@Autowired
	private TransactionTemplate transactionTemplate;

	@MockitoBean
	private CodeRunnerClient codeRunnerClient;

	@Test
	void everyModuleOfTheJavaCourseHasLessonsAndExercises() throws Exception {
		JsonNode course = json(mockMvc.perform(get("/api/courses/1")).andExpect(status().isOk()).andReturn());

		assertThat(course.get("modules")).hasSize(25);
		for (JsonNode module : course.get("modules")) {
			assertThat(module.get("published").asBoolean()).as(module.get("slug").asString()).isTrue();
			assertThat(module.get("lessonCount").asInt()).as(module.get("slug").asString()).isPositive();
			assertThat(module.get("exerciseCount").asInt()).as(module.get("slug").asString()).isPositive();
		}
	}

	@Test
	void aLearnerRegistersReadsSolvesAndSeesItOnTheDashboard() throws Exception {
		String token = json(mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\": \"grace@example.com\", \"displayName\": \"Grace\", \"password\": \"cobol-1959\"}"))
			.andExpect(status().isCreated())
			.andReturn()).get("token").asString();

		JsonNode lesson = json(mockMvc.perform(get("/api/courses/1/modules/fundamentos/lessons/primer-programa"))
			.andExpect(status().isOk())
			.andReturn());
		mockMvc
			.perform(post("/api/progress/lessons/" + lesson.get("id").asLong()).header("Authorization",
					"Bearer " + token))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.newlyCompleted").value(true));

		// The runner answers with exactly the expected output of every test case.
		List<RunnerExecution.Run> runs = transactionTemplate.execute(status -> {
			Exercise exercise = exerciseRepository.findBySlug("saludo-personalizado").orElseThrow();
			return exercise.getTestCases()
				.stream()
				.map(testCase -> new RunnerExecution.Run(0, false, testCase.getExpectedStdout(), false, "", false, 50))
				.toList();
		});
		when(codeRunnerClient.execute(eq("java"), anyString(), anyList()))
			.thenReturn(new RunnerExecution.Result("COMPLETED", new RunnerExecution.Compile(true, "", false, 600),
					runs, 900));

		mockMvc.perform(post("/api/exercises/saludo-personalizado/submissions").header("Authorization", "Bearer " + token)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"sourceCode\": \"public class Main {}\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("ACCEPTED"))
			.andExpect(jsonPath("$.firstSolve").value(true))
			.andExpect(jsonPath("$.xpAwarded").value(20));

		mockMvc.perform(get("/api/dashboard").param("timezone", "America/Bogota").header("Authorization", "Bearer " + token))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.user.displayName").value("Grace"))
			.andExpect(jsonPath("$.xp").value(30))
			.andExpect(jsonPath("$.streak.current").value(1))
			.andExpect(jsonPath("$.totals.lessonsCompleted").value(1))
			.andExpect(jsonPath("$.totals.exercisesSolved").value(1))
			.andExpect(jsonPath("$.dailyGoal.goalXp").value(30))
			.andExpect(jsonPath("$.dailyGoal.todayXp").value(30))
			.andExpect(jsonPath("$.reviewsDue").value(0));

		mockMvc.perform(put("/api/auth/me/daily-goal").header("Authorization", "Bearer " + token)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"dailyGoalXp\": 50}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.dailyGoalXp").value(50));
		mockMvc.perform(put("/api/auth/me/daily-goal").header("Authorization", "Bearer " + token)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"dailyGoalXp\": 5}"))
			.andExpect(status().isBadRequest());

		mockMvc.perform(get("/api/progress/courses/1").header("Authorization", "Bearer " + token))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.solvedExerciseSlugs[0]").value("saludo-personalizado"));
	}

	@Test
	void hiddenTestCasesNeverReachThePublicExercise() throws Exception {
		JsonNode exercise = json(mockMvc.perform(get("/api/exercises/saludo-personalizado"))
			.andExpect(status().isOk())
			.andReturn());

		assertThat(exercise.get("totalTests").asInt()).isGreaterThan(exercise.get("samples").size());
		assertThat(exercise.has("solutionCode")).isFalse();
		assertThat(exercise.has("hints")).isFalse();
	}

	@Test
	void lessonsCarryTheirQuizAndTheCourseHasAGlossary() throws Exception {
		JsonNode lesson = json(mockMvc.perform(get("/api/courses/1/modules/fundamentos/lessons/primer-programa"))
			.andExpect(status().isOk())
			.andReturn());
		assertThat(lesson.get("quiz")).isNotEmpty();
		JsonNode question = lesson.get("quiz").get(0);
		assertThat(question.get("type").asString()).isIn("CHOICE", "OUTPUT");
		assertThat(question.get("explanation").asString()).isNotBlank();

		JsonNode glossary = json(mockMvc.perform(get("/api/courses/1/glossary")).andExpect(status().isOk()).andReturn());
		assertThat(glossary.size()).isGreaterThan(50);
		assertThat(glossary.get(0).get("definition").asString()).isNotBlank();
	}

	@Test
	void aPredictionIsGradedWithoutRunningAndTheAnswerStaysHidden() throws Exception {
		String slug = firstOfKind(ExerciseKind.PREDICT);
		String expected = transactionTemplate.execute(
				status -> exerciseRepository.findBySlug(slug).orElseThrow().getTestCases().get(0).getExpectedStdout());
		JsonNode exercise = json(mockMvc.perform(get("/api/exercises/" + slug)).andExpect(status().isOk()).andReturn());
		assertThat(exercise.get("kind").asString()).isEqualTo("PREDICT");
		assertThat(exercise.toString()).doesNotContain(expected.strip());

		String token = register("ada@example.com");
		mockMvc.perform(post("/api/exercises/" + slug + "/submissions").header("Authorization", "Bearer " + token)
			.contentType(MediaType.APPLICATION_JSON)
			.content(objectMapper.writeValueAsString(java.util.Map.of("sourceCode", "no lo sé"))))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("WRONG_ANSWER"))
			.andExpect(jsonPath("$.feedback").isNotEmpty());
		mockMvc.perform(post("/api/exercises/" + slug + "/submissions").header("Authorization", "Bearer " + token)
			.contentType(MediaType.APPLICATION_JSON)
			.content(objectMapper.writeValueAsString(java.util.Map.of("sourceCode", expected))))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("ACCEPTED"))
			.andExpect(jsonPath("$.firstSolve").value(true));
		verifyNoInteractions(codeRunnerClient);
	}

	@Test
	void parsonsAndFillExercisesAreAssembledFromTheirParts() throws Exception {
		String parsons = firstOfKind(ExerciseKind.PARSONS);
		JsonNode exercise = json(mockMvc.perform(get("/api/exercises/" + parsons)).andExpect(status().isOk()).andReturn());
		assertThat(exercise.get("parsonsLines")).isNotEmpty();

		String fill = firstOfKind(ExerciseKind.FILL);
		String token = register("linus@example.com");
		mockMvc.perform(post("/api/exercises/" + fill + "/submissions").header("Authorization", "Bearer " + token)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"parts\": []}"))
			.andExpect(status().isBadRequest());
	}

	private String firstOfKind(ExerciseKind kind) {
		return transactionTemplate.execute(status -> exerciseRepository.findAll()
			.stream()
			.filter(exercise -> exercise.getKind() == kind && exercise.isPublished())
			.findFirst()
			.orElseThrow(() -> new AssertionError("The course has no " + kind + " exercise"))
			.getSlug());
	}

	private String register(String email) throws Exception {
		return json(mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\": \"%s\", \"displayName\": \"Learner\", \"password\": \"secreto-123\"}".formatted(email)))
			.andExpect(status().isCreated())
			.andReturn()).get("token").asString();
	}

	private JsonNode json(MvcResult result) throws Exception {
		return objectMapper.readTree(result.getResponse().getContentAsString());
	}

}
