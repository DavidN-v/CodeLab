package com.forja.api.mapper;

import com.forja.api.dto.CourseDetailResponse;
import com.forja.api.dto.CourseSummaryResponse;
import com.forja.api.dto.ModuleSummaryResponse;
import com.forja.api.entity.Course;
import com.forja.api.entity.CourseModule;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {

	private final LanguageMapper languageMapper;

	public CourseMapper(LanguageMapper languageMapper) {
		this.languageMapper = languageMapper;
	}

	public CourseSummaryResponse toSummary(Course course) {
		return new CourseSummaryResponse(course.getId(), course.getSlug(), course.getTitle(), course.getSummary(),
				course.getLanguage().getSlug());
	}

	public CourseDetailResponse toDetail(Course course) {
		List<ModuleSummaryResponse> modules = course.getModules().stream().map(this::toModuleSummary).toList();
		return new CourseDetailResponse(course.getId(), course.getSlug(), course.getTitle(), course.getSummary(),
				course.getDescription(), languageMapper.toResponse(course.getLanguage()), modules);
	}

	private ModuleSummaryResponse toModuleSummary(CourseModule module) {
		return new ModuleSummaryResponse(module.getId(), module.getSlug(), module.getTitle(), module.getSummary(),
				module.getDisplayOrder(), module.isPublished());
	}

}
