package com.forja.api.service.impl;

import com.forja.api.dto.CourseDetailResponse;
import com.forja.api.dto.CourseSummaryResponse;
import com.forja.api.entity.Course;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.mapper.CourseMapper;
import com.forja.api.repository.CourseRepository;
import com.forja.api.service.CourseService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CourseServiceImpl implements CourseService {

	private final CourseRepository courseRepository;

	private final CourseMapper courseMapper;

	public CourseServiceImpl(CourseRepository courseRepository, CourseMapper courseMapper) {
		this.courseRepository = courseRepository;
		this.courseMapper = courseMapper;
	}

	@Override
	public List<CourseSummaryResponse> findPublished(String languageSlug) {
		List<Course> courses = languageSlug == null ? courseRepository.findByPublishedTrueOrderByDisplayOrderAsc()
				: courseRepository.findByLanguageSlugAndPublishedTrueOrderByDisplayOrderAsc(languageSlug);
		return courses.stream().map(courseMapper::toSummary).toList();
	}

	@Override
	public CourseDetailResponse findById(Long id) {
		return courseRepository.findByIdAndPublishedTrue(id)
			.map(courseMapper::toDetail)
			.orElseThrow(() -> new ResourceNotFoundException("No existe el curso con id %d.".formatted(id)));
	}

}
