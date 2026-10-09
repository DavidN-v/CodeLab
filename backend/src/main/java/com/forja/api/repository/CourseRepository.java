package com.forja.api.repository;

import com.forja.api.entity.Course;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Long> {

	@EntityGraph(attributePaths = "language")
	List<Course> findByPublishedTrueOrderByDisplayOrderAsc();

	@EntityGraph(attributePaths = "language")
	List<Course> findByLanguageSlugAndPublishedTrueOrderByDisplayOrderAsc(String languageSlug);

	Optional<Course> findBySlug(String slug);

	@EntityGraph(attributePaths = { "language", "modules" })
	Optional<Course> findByIdAndPublishedTrue(Long id);

}
