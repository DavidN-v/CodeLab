package com.forja.api.tutor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class LabTutorServiceTest {

	private final TutorModel model = mock(TutorModel.class);

	private final ModuleRepository modules = mock(ModuleRepository.class);

	private final RateLimiter limiter = mock(RateLimiter.class);

	private final LabTutorService service = new LabTutorService(model, modules, limiter);

	private final List<LabFileDto> files = List.of(new LabFileDto("main.js", "function sumar(a, b) {\n  return a - b;\n}"),
			new LabFileDto("index.html", "<h1>Calculadora</h1>"));

	@BeforeEach
	void admitEveryone() {
		when(limiter.tryAcquire(any())).thenReturn(true);
		when(modules.findPublishedTitles()).thenReturn(List.<Object[]>of(new Object[] { "Java desde cero", "Operadores" }));
	}

	@Test
	void readsAPlanEvenWhenTheModelWrapsItInACodeFence() {
		when(model.answer(anyString(), anyString())).thenReturn("""
				```json
				{"goal": "Una calculadora", "questions": [], "requirements": ["Sumar dos números"],
				 "steps": ["Crea la función sumar"], "concepts": ["Funciones: recetas con nombre"],
				 "tests": [{"description": "suma", "expression": "sumar(2, 3)", "expected": "5"}],
				 "extra": "se ignora"}
				```""");

		LabPlanResponse plan = service.plan(7L, new LabPlanRequest("Quiero una calculadora", null));

		assertThat(plan.goal()).isEqualTo("Una calculadora");
		assertThat(plan.questions()).isEmpty();
		assertThat(plan.tests()).containsExactly(new LabPlanResponse.ProposedTest("suma", "sumar(2, 3)", "5"));
	}

	@Test
	void aPlanWithMissingListsHasEmptyOnes() {
		when(model.answer(anyString(), anyString())).thenReturn("{\"goal\": \"Algo\"}");

		LabPlanResponse plan = service.plan(7L, new LabPlanRequest("algo", null));

		assertThat(plan.requirements()).isEmpty();
		assertThat(plan.tests()).isEmpty();
	}

	@Test
	void anUnreadablePlanIsReportedInsteadOfInvented() {
		when(model.answer(anyString(), anyString())).thenReturn("Claro, te ayudo con la calculadora.");

		assertThatThrownBy(() -> service.plan(7L, new LabPlanRequest("calculadora", null)))
			.isInstanceOf(TutorUnavailableException.class);
	}

	@Test
	void helpGivesTheModelTheRealEvidenceAndNumberedLines() {
		when(model.answer(anyString(), anyString())).thenReturn("**Confirmado:** la prueba falla.");
		LabHelpRequest request = new LabHelpRequest(3, "calculadora", "sumar dos números", files, null, "",
				"sumar(2, 3): esperado 5, obtenido -1", null, "¿por qué falla?");

		String answer = service.help(7L, request);

		assertThat(answer).startsWith("**Confirmado:**");
		ArgumentCaptor<String> prompt = ArgumentCaptor.forClass(String.class);
		verify(model).answer(anyString(), prompt.capture());
		assertThat(prompt.getValue()).contains("2|   return a - b;")
			.contains("esperado 5, obtenido -1")
			.contains("Su pregunta: ¿por qué falla?")
			.contains("- Java desde cero: Operadores")
			// Nothing was reported by the compiler, and the tutor is told so.
			.contains("<diagnosticos_reales>\n(nada)");
	}

	@Test
	void aFixAlwaysTargetsTheFileTheLearnerChose() {
		when(model.answer(anyString(), anyString())).thenReturn(
				"{\"path\": \"otro.js\", \"content\": \"function sumar(a, b) {\\n  return a + b;\\n}\", \"explanation\": \"Cambié - por +\"}");
		LabHelpRequest request = new LabHelpRequest(4, null, null, files, null, null, null, "main.js", null);

		LabFixResponse fix = service.fix(7L, request);

		assertThat(fix.path()).isEqualTo("main.js");
		assertThat(fix.content()).contains("return a + b;");
		assertThat(fix.explanation()).isEqualTo("Cambié - por +");
	}

	@Test
	void aFixNeedsAFileOfTheProject() {
		LabHelpRequest request = new LabHelpRequest(4, null, null, files, null, null, null, "no-existe.js", null);

		assertThatThrownBy(() -> service.fix(7L, request)).isInstanceOf(InvalidRequestException.class);
	}

	@Test
	void theRateLimitAppliesBeforeCallingTheModel() {
		when(limiter.tryAcquire(7L)).thenReturn(false);

		assertThatThrownBy(() -> service.plan(7L, new LabPlanRequest("algo", null)))
			.isInstanceOf(TooManyRequestsException.class);
	}

}
