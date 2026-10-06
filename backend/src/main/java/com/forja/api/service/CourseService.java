package com.forja.api.service;

import com.forja.api.dto.CourseDetailResponse;
import com.forja.api.dto.CourseSummaryResponse;
import java.util.List;

public interface CourseService {

	/**
	 * Published courses in display order.
	 * @param languageSlug restricts the result to one language; {@code null} returns all
	 */
	List<CourseSummaryResponse> findPublished(String languageSlug);

	/** @throws com.forja.api.exception.ResourceNotFoundException if the course does not exist or is unpublished */
	CourseDetailResponse findById(Long id);

}
