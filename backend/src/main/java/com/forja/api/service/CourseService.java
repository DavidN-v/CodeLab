package com.forja.api.service;

import com.forja.api.dto.CourseDetailResponse;
import com.forja.api.dto.CourseSummaryResponse;
import com.forja.api.dto.ExerciseSummaryResponse;
import com.forja.api.dto.LessonDetailResponse;
import com.forja.api.dto.ModuleDetailResponse;
import java.util.List;

public interface CourseService {

	/**
	 * Published courses in display order.
	 * @param languageSlug restricts the result to one language; {@code null} returns all
	 */
	List<CourseSummaryResponse> findPublished(String languageSlug);

	/** @throws com.forja.api.exception.ResourceNotFoundException if the course does not exist or is unpublished */
	CourseDetailResponse findById(Long id);

	/** @throws com.forja.api.exception.ResourceNotFoundException if the module is not published in that course */
	ModuleDetailResponse findModule(Long courseId, String moduleSlug);

	/** @throws com.forja.api.exception.ResourceNotFoundException if the lesson is not published there */
	LessonDetailResponse findLesson(Long courseId, String moduleSlug, String lessonSlug);

	/** Published exercises of the course, in module order. */
	List<ExerciseSummaryResponse> findExercises(Long courseId);

}
