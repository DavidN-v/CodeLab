package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(name = "QuizQuestion", description = "A self-assessment question at the end of a lesson; answers are included.")
public record QuizQuestionResponse(
		@Schema(description = "CHOICE (pick an option) or OUTPUT (type what the program prints).") String type,
		@Schema(description = "The question, in CommonMark.") String prompt,
		@Schema(description = "Java code the question is about; may be null for CHOICE.") String code,
		@Schema(description = "CHOICE only.") List<String> options,
		@Schema(description = "CHOICE only: index of the right option.") Integer correctOption,
		@Schema(description = "OUTPUT only: what the program prints.") String expectedOutput,
		@Schema(description = "OUTPUT only: what the program reads from standard input.") String input,
		@Schema(description = "Why the answer is right, in CommonMark.") String explanation) {
}
