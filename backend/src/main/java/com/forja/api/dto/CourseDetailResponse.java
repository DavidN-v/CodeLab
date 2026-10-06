package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(name = "CourseDetail", description = "A course with its language and ordered module outline.")
public record CourseDetailResponse(
		@Schema(example = "1") Long id,
		@Schema(example = "java-desde-cero") String slug,
		@Schema(example = "Java desde cero") String title,
		String summary,
		String description,
		LanguageResponse language,
		List<ModuleSummaryResponse> modules) {
}
