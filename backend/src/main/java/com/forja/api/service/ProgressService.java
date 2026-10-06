package com.forja.api.service;

import com.forja.api.dto.CourseProgressResponse;
import com.forja.api.dto.LessonCompletionResponse;

public interface ProgressService {

	/** Idempotent: completing a lesson twice keeps the first date and awards experience once. */
	LessonCompletionResponse completeLesson(Long userId, Long lessonId);

	CourseProgressResponse findCourseProgress(Long userId, Long courseId);

}
