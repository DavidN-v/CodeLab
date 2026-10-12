package com.forja.api.tutor;

import com.forja.api.dto.LabFileDto;
import com.forja.api.dto.LabFixResponse;
import com.forja.api.dto.LabHelpRequest;
import com.forja.api.dto.LabPlanRequest;
import com.forja.api.dto.LabPlanResponse;
import com.forja.api.exception.InvalidRequestException;
import com.forja.api.exception.TooManyRequestsException;
import com.forja.api.exception.TutorUnavailableException;
import com.forja.api.learning.RateLimiter;
import com.forja.api.repository.ModuleRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * The tutor in the lab: turns an idea into a plan, helps at the level the
 * learner asks for, and proposes a correction when they request one. It only
 * ever sees evidence produced by the browser's real tools.
 */
@Service
public class LabTutorService {

	private static final String DECLINED = "No puedo ayudarte con eso. Prueba a explicarme qué quieres construir "
			+ "o qué problema ves.";

	private static final String NONE = "(nada)";

	private static final int MAX_PROJECT_CHARS = 120_000;

	private final TutorModel model;

	private final ModuleRepository modules;

	private final RateLimiter rateLimiter;

	private final JsonMapper json = JsonMapper.builder()
		.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
		.build();

	public LabTutorService(TutorModel model, ModuleRepository modules,
			@Qualifier("tutorRateLimiter") RateLimiter rateLimiter) {
		this.model = model;
		this.modules = modules;
		this.rateLimiter = rateLimiter;
	}

	public LabPlanResponse plan(Long userId, LabPlanRequest request) {
		admit(userId);
		String answer = model.answer(LabPrompts.SYSTEM,
				LabPrompts.PLAN.formatted(request.idea().strip(), orNone(request.answers())));
		return parse(answer, LabPlanResponse.class);
	}

	public String help(Long userId, LabHelpRequest request) {
		admit(userId);
		String task = request.level() == 0 ? LabPrompts.EXPLAIN.formatted(orNone(request.focus()))
				: LabPrompts.LEVELS[request.level()];
		String question = request.question() == null || request.question().isBlank() ? ""
				: "Su pregunta: " + request.question().strip();
		String answer = model.answer(LabPrompts.SYSTEM,
				LabPrompts.HELP.formatted(task, question, goal(request), files(request.files()),
						orNone(request.diagnostics()), orNone(request.console()), orNone(request.tests()),
						moduleList()));
		return answer == null || answer.isBlank() ? DECLINED : answer;
	}

	public LabFixResponse fix(Long userId, LabHelpRequest request) {
		admit(userId);
		String path = request.focus() == null ? "" : request.focus().strip();
		LabFileDto target = request.files()
			.stream()
			.filter(file -> file.path().equals(path))
			.findFirst()
			.orElseThrow(() -> new InvalidRequestException("Elige el archivo que quieres corregir."));
		String answer = model.answer(LabPrompts.SYSTEM,
				LabPrompts.FIX.formatted(target.path(), goal(request), files(request.files()),
						orNone(request.diagnostics()), orNone(request.console()), orNone(request.tests())));
		LabFixResponse fix = parse(answer, LabFixResponse.class);
		if (fix.content() == null || fix.content().isBlank()) {
			throw unreadable();
		}
		// The correction always lands on the file the learner chose, whatever the model named.
		return new LabFixResponse(target.path(), fix.content(), fix.explanation() == null ? "" : fix.explanation());
	}

	private <T> T parse(String answer, Class<T> type) {
		if (answer == null || answer.isBlank()) {
			throw new TutorUnavailableException("The tutor declined a lab request", DECLINED, null);
		}
		int start = answer.indexOf('{');
		int end = answer.lastIndexOf('}');
		if (start < 0 || end <= start) {
			throw unreadable();
		}
		try {
			return json.readValue(answer.substring(start, end + 1), type);
		}
		catch (JacksonException ex) {
			throw unreadable();
		}
	}

	private static TutorUnavailableException unreadable() {
		return new TutorUnavailableException("The tutor answered a lab request with unreadable JSON",
				"El tutor ha respondido con un formato que no se puede leer. Vuelve a intentarlo.", null);
	}

	private static String goal(LabHelpRequest request) {
		return "Idea: %s\nRequisitos:\n%s".formatted(orNone(request.idea()), orNone(request.requirements()));
	}

	private static String files(List<LabFileDto> files) {
		String all = files.stream()
			.map(file -> "<archivo ruta=\"%s\">\n%s\n</archivo>".formatted(file.path(), numbered(file.content())))
			.collect(Collectors.joining("\n\n"));
		if (all.length() > MAX_PROJECT_CHARS) {
			throw new InvalidRequestException("El proyecto es demasiado grande para enviarlo al tutor.");
		}
		return all;
	}

	/** Line numbers let the tutor cite a location it can actually see. */
	private static String numbered(String content) {
		String[] lines = content.split("\n", -1);
		StringBuilder out = new StringBuilder(content.length() + lines.length * 6);
		for (int i = 0; i < lines.length; i++) {
			out.append(i + 1).append("| ").append(lines[i]).append('\n');
		}
		return out.toString().stripTrailing();
	}

	private String moduleList() {
		return modules.findPublishedTitles()
			.stream()
			.map(row -> "- %s: %s".formatted(row[0], row[1]))
			.collect(Collectors.joining("\n"));
	}

	private static String orNone(String text) {
		return text == null || text.isBlank() ? NONE : text.strip();
	}

	private void admit(Long userId) {
		if (!rateLimiter.tryAcquire(userId)) {
			throw new TooManyRequestsException("Has preguntado mucho al tutor en poco tiempo. Espera un minuto.");
		}
	}

}
