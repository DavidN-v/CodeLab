package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * An idea turned into something programmable. The tests are proposals: the
 * learner decides which ones describe what they really want.
 */
@Schema(name = "LabPlan")
public record LabPlanResponse(String goal, List<String> questions, List<String> requirements, List<String> steps,
		List<String> concepts, List<ProposedTest> tests) {

	@Schema(name = "LabProposedTest")
	public record ProposedTest(String description, String expression, String expected) {
	}

	public LabPlanResponse {
		questions = questions == null ? List.of() : List.copyOf(questions);
		requirements = requirements == null ? List.of() : List.copyOf(requirements);
		steps = steps == null ? List.of() : List.copyOf(steps);
		concepts = concepts == null ? List.of() : List.copyOf(concepts);
		tests = tests == null ? List.of() : List.copyOf(tests);
	}

}
