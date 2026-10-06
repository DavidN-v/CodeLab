package com.forja.api.mapper;

import com.forja.api.dto.CourseDetailResponse;
import com.forja.api.dto.CourseSummaryResponse;
import com.forja.api.dto.ModuleSummaryResponse;
import com.forja.api.entity.Course;
import com.forja.api.entity.CourseModule;
import com.forja.api.repository.ExerciseOutline;
import com.forja.api.repository.LessonOutline;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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

	/**
	 * @param lessons the course's published lessons, used for per-module counts
	 * @param exercises the course's published exercises, used for per-module counts
	 */
	public CourseDetailResponse toDetail(Course course, List<LessonOutline> lessons, List<ExerciseOutline> exercises) {
		Map<Long, List<LessonOutline>> lessonsByModule = lessons.stream()
			.collect(Collectors.groupingBy(LessonOutline::moduleId));
		Map<Long, Long> exercisesByModule = exercises.stream()
			.collect(Collectors.groupingBy(ExerciseOutline::moduleId, Collectors.counting()));
		List<ModuleSummaryResponse> modules = course.getModules()
			.stream()
			.map(module -> toModuleSummary(module, lessonsByModule.getOrDefault(module.getId(), List.of()),
					exercisesByModule.getOrDefault(module.getId(), 0L).intValue()))
			.toList();
		return new CourseDetailResponse(course.getId(), course.getSlug(), course.getTitle(), course.getSummary(),
				course.getDescription(), languageMapper.toResponse(course.getLanguage()), modules);
	}

	private ModuleSummaryResponse toModuleSummary(CourseModule module, List<LessonOutline> lessons, int exercises) {
		int minutes = lessons.stream().mapToInt(LessonOutline::estimatedMinutes).sum();
		return new ModuleSummaryResponse(module.getId(), module.getSlug(), module.getTitle(), module.getSummary(),
				module.getDisplayOrder(), module.isPublished(), lessons.size(), exercises, minutes);
	}

}
