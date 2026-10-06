package com.forja.api.mapper;

import com.forja.api.dto.CourseRefResponse;
import com.forja.api.dto.ExerciseSummaryResponse;
import com.forja.api.dto.LessonRefResponse;
import com.forja.api.dto.LessonSummaryResponse;
import com.forja.api.dto.ModuleRefResponse;
import com.forja.api.entity.Course;
import com.forja.api.entity.CourseModule;
import com.forja.api.repository.ExerciseOutline;
import com.forja.api.repository.LessonOutline;
import org.springframework.stereotype.Component;

/** The small reference DTOs that link pages to each other. */
@Component
public class RefMapper {

	public CourseRefResponse toRef(Course course) {
		return new CourseRefResponse(course.getId(), course.getSlug(), course.getTitle(),
				course.getLanguage().getSlug(), course.getLanguage().getName());
	}

	public ModuleRefResponse toRef(CourseModule module) {
		return new ModuleRefResponse(module.getId(), module.getSlug(), module.getTitle(), module.getDisplayOrder());
	}

	public LessonRefResponse toRef(LessonOutline lesson) {
		return lesson == null ? null
				: new LessonRefResponse(lesson.id(), lesson.slug(), lesson.title(), lesson.moduleSlug(),
						lesson.moduleTitle());
	}

	public LessonSummaryResponse toSummary(LessonOutline lesson) {
		return new LessonSummaryResponse(lesson.id(), lesson.slug(), lesson.title(), lesson.summary(),
				lesson.estimatedMinutes(), lesson.position());
	}

	public ModuleRefResponse moduleOf(LessonOutline lesson) {
		return new ModuleRefResponse(lesson.moduleId(), lesson.moduleSlug(), lesson.moduleTitle(),
				lesson.modulePosition());
	}

	public ExerciseSummaryResponse toSummary(ExerciseOutline exercise) {
		return exercise == null ? null
				: new ExerciseSummaryResponse(exercise.id(), exercise.slug(), exercise.title(), exercise.summary(),
						exercise.difficulty(), new ModuleRefResponse(exercise.moduleId(), exercise.moduleSlug(),
								exercise.moduleTitle(), exercise.modulePosition()));
	}

}
