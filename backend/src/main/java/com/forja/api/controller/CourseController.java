package com.forja.api.controller;

import com.forja.api.dto.ApiErrorResponse;
import com.forja.api.dto.CourseDetailResponse;
import com.forja.api.dto.CourseSummaryResponse;
import com.forja.api.dto.ExerciseSummaryResponse;
import com.forja.api.dto.LessonDetailResponse;
import com.forja.api.dto.ModuleDetailResponse;
import com.forja.api.service.CourseService;
import com.forja.api.util.SlugRules;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/courses")
@Tag(name = "Courses", description = "Courses, their modules and lessons.")
public class CourseController {

	private final CourseService courseService;

	public CourseController(CourseService courseService) {
		this.courseService = courseService;
	}

	@GetMapping
	@Operation(summary = "List published courses",
			description = "Optionally filtered by language. An unknown language yields an empty list.")
	@ApiResponse(responseCode = "200", description = "Courses found.")
	@ApiResponse(responseCode = "400", description = "The language filter is malformed.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public List<CourseSummaryResponse> listCourses(
			@Parameter(description = "Language slug to filter by.", example = "java")
			@RequestParam(required = false)
			@Pattern(regexp = SlugRules.PATTERN, message = SlugRules.MESSAGE) String language) {
		return courseService.findPublished(language);
	}

	@GetMapping("/{id}")
	@Operation(summary = "Get a course with its modules",
			description = "Modules come in course order. Unpublished modules are included, flagged with published=false, so clients can show the roadmap.")
	@ApiResponse(responseCode = "200", description = "Course found.")
	@ApiResponse(responseCode = "400", description = "The id is not a positive number.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	@ApiResponse(responseCode = "404", description = "The course does not exist or is not published.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public CourseDetailResponse getCourse(@PathVariable @Positive(message = "debe ser mayor que 0") Long id) {
		return courseService.findById(id);
	}

	@GetMapping("/{id}/modules/{moduleSlug}")
	@Operation(summary = "Get a module with its lessons and exercises")
	@ApiResponse(responseCode = "200", description = "Module found.")
	@ApiResponse(responseCode = "404", description = "The module is not published in that course.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public ModuleDetailResponse getModule(@PathVariable @Positive(message = "debe ser mayor que 0") Long id,
			@Parameter(example = "variables") @PathVariable @Pattern(regexp = SlugRules.PATTERN,
					message = SlugRules.MESSAGE) String moduleSlug) {
		return courseService.findModule(id, moduleSlug);
	}

	@GetMapping("/{id}/modules/{moduleSlug}/lessons/{lessonSlug}")
	@Operation(summary = "Get a lesson",
			description = "Includes the previous and next lesson in reading order, which may belong to a neighbouring module.")
	@ApiResponse(responseCode = "200", description = "Lesson found.")
	@ApiResponse(responseCode = "404", description = "The lesson is not published there.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public LessonDetailResponse getLesson(@PathVariable @Positive(message = "debe ser mayor que 0") Long id,
			@PathVariable @Pattern(regexp = SlugRules.PATTERN, message = SlugRules.MESSAGE) String moduleSlug,
			@PathVariable @Pattern(regexp = SlugRules.PATTERN, message = SlugRules.MESSAGE) String lessonSlug) {
		return courseService.findLesson(id, moduleSlug, lessonSlug);
	}

	@GetMapping("/{id}/exercises")
	@Operation(summary = "List a course's exercises", description = "Published exercises in module order.")
	@ApiResponse(responseCode = "200", description = "Exercises found.")
	@ApiResponse(responseCode = "404", description = "The course does not exist or is not published.",
			content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
	public List<ExerciseSummaryResponse> listExercises(
			@PathVariable @Positive(message = "debe ser mayor que 0") Long id) {
		return courseService.findExercises(id);
	}

}
