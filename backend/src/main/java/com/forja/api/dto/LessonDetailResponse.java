package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LessonDetail", description = "A lesson's content and its place in the course.")
public record LessonDetailResponse(
		@Schema(example = "12") Long id,
		@Schema(example = "declarar-variables") String slug,
		@Schema(example = "Declarar e inicializar variables") String title,
		String summary,
		@Schema(example = "10") int estimatedMinutes,
		@Schema(example = "1") int position,
		@Schema(description = "Lesson body in CommonMark. Java code blocks can be opened in the playground.") String contentMarkdown,
		CourseRefResponse course,
		ModuleRefResponse module,
		@Schema(description = "Previous lesson in reading order, crossing module boundaries.") LessonRefResponse previous,
		@Schema(description = "Next lesson in reading order, crossing module boundaries.") LessonRefResponse next) {
}
