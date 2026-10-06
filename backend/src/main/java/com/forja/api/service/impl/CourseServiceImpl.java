package com.forja.api.service.impl;

import com.forja.api.dto.CourseDetailResponse;
import com.forja.api.dto.CourseSummaryResponse;
import com.forja.api.dto.ExerciseSummaryResponse;
import com.forja.api.dto.LessonDetailResponse;
import com.forja.api.dto.ModuleDetailResponse;
import com.forja.api.dto.ModuleRefResponse;
import com.forja.api.entity.Course;
import com.forja.api.entity.CourseModule;
import com.forja.api.entity.Lesson;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.mapper.CourseMapper;
import com.forja.api.mapper.RefMapper;
import com.forja.api.repository.CourseRepository;
import com.forja.api.repository.ExerciseOutline;
import com.forja.api.repository.ExerciseRepository;
import com.forja.api.repository.LessonOutline;
import com.forja.api.repository.LessonRepository;
import com.forja.api.repository.ModuleRepository;
import com.forja.api.service.CourseService;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CourseServiceImpl implements CourseService {

	private final CourseRepository courseRepository;

	private final ModuleRepository moduleRepository;

	private final LessonRepository lessonRepository;

	private final ExerciseRepository exerciseRepository;

	private final CourseMapper courseMapper;

	private final RefMapper refMapper;

	public CourseServiceImpl(CourseRepository courseRepository, ModuleRepository moduleRepository,
			LessonRepository lessonRepository, ExerciseRepository exerciseRepository, CourseMapper courseMapper,
			RefMapper refMapper) {
		this.courseRepository = courseRepository;
		this.moduleRepository = moduleRepository;
		this.lessonRepository = lessonRepository;
		this.exerciseRepository = exerciseRepository;
		this.courseMapper = courseMapper;
		this.refMapper = refMapper;
	}

	@Override
	public List<CourseSummaryResponse> findPublished(String languageSlug) {
		List<Course> courses = languageSlug == null ? courseRepository.findByPublishedTrueOrderByDisplayOrderAsc()
				: courseRepository.findByLanguageSlugAndPublishedTrueOrderByDisplayOrderAsc(languageSlug);
		return courses.stream().map(courseMapper::toSummary).toList();
	}

	@Override
	public CourseDetailResponse findById(Long id) {
		Course course = courseRepository.findByIdAndPublishedTrue(id)
			.orElseThrow(() -> new ResourceNotFoundException("No existe el curso con id %d.".formatted(id)));
		return courseMapper.toDetail(course, lessonRepository.findOutlinesByCourse(id),
				exerciseRepository.findOutlinesByCourse(id));
	}

	@Override
	public ModuleDetailResponse findModule(Long courseId, String moduleSlug) {
		CourseModule module = moduleRepository.findPublished(courseId, moduleSlug)
			.orElseThrow(() -> new ResourceNotFoundException("No existe el módulo '%s'.".formatted(moduleSlug)));
		Course course = module.getCourse();

		List<CourseModule> published = courseRepository.findByIdAndPublishedTrue(courseId)
			.map(Course::getModules)
			.orElse(List.of())
			.stream()
			.filter(CourseModule::isPublished)
			.toList();
		int index = -1;
		for (int i = 0; i < published.size(); i++) {
			if (published.get(i).getId().equals(module.getId())) {
				index = i;
			}
		}
		ModuleRefResponse previous = index > 0 ? refMapper.toRef(published.get(index - 1)) : null;
		ModuleRefResponse next = index >= 0 && index < published.size() - 1 ? refMapper.toRef(published.get(index + 1))
				: null;

		return new ModuleDetailResponse(module.getId(), module.getSlug(), module.getTitle(), module.getSummary(),
				module.getDisplayOrder(), refMapper.toRef(course),
				lessonRepository.findOutlinesByCourse(courseId)
					.stream()
					.filter(lesson -> lesson.moduleId().equals(module.getId()))
					.map(refMapper::toSummary)
					.toList(),
				exerciseRepository.findOutlinesByCourse(courseId)
					.stream()
					.filter(exercise -> exercise.moduleId().equals(module.getId()))
					.map(refMapper::toSummary)
					.toList(),
				previous, next);
	}

	@Override
	public LessonDetailResponse findLesson(Long courseId, String moduleSlug, String lessonSlug) {
		Lesson lesson = lessonRepository.findPublished(courseId, moduleSlug, lessonSlug)
			.orElseThrow(() -> new ResourceNotFoundException("No existe la lección '%s'.".formatted(lessonSlug)));
		List<LessonOutline> outline = lessonRepository.findOutlinesByCourse(courseId);
		int index = indexOf(outline, lesson.getId());

		return new LessonDetailResponse(lesson.getId(), lesson.getSlug(), lesson.getTitle(), lesson.getSummary(),
				lesson.getEstimatedMinutes(), lesson.getDisplayOrder(), lesson.getContentMarkdown(),
				refMapper.toRef(lesson.getModule().getCourse()), refMapper.toRef(lesson.getModule()),
				index > 0 ? refMapper.toRef(outline.get(index - 1)) : null,
				index >= 0 && index < outline.size() - 1 ? refMapper.toRef(outline.get(index + 1)) : null);
	}

	@Override
	public List<ExerciseSummaryResponse> findExercises(Long courseId) {
		if (courseRepository.findByIdAndPublishedTrue(courseId).isEmpty()) {
			throw new ResourceNotFoundException("No existe el curso con id %d.".formatted(courseId));
		}
		List<ExerciseOutline> exercises = exerciseRepository.findOutlinesByCourse(courseId);
		return exercises.stream().map(refMapper::toSummary).toList();
	}

	private static int indexOf(List<LessonOutline> outline, Long lessonId) {
		for (int i = 0; i < outline.size(); i++) {
			if (Objects.equals(outline.get(i).id(), lessonId)) {
				return i;
			}
		}
		return -1;
	}

}
