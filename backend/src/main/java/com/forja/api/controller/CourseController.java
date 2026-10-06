package com.forja.api.controller;

import com.forja.api.dto.ApiErrorResponse;
import com.forja.api.dto.CourseDetailResponse;
import com.forja.api.dto.CourseSummaryResponse;
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
@Tag(name = "Courses", description = "Courses and their module outline.")
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

}
