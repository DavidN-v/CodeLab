package com.forja.api.repository;

import com.forja.api.entity.CourseModule;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ModuleRepository extends JpaRepository<CourseModule, Long> {

	Optional<CourseModule> findByCourseSlugAndSlug(String courseSlug, String slug);

	@Query("""
			select m from CourseModule m join fetch m.course c join fetch c.language
			where c.id = :courseId and m.slug = :slug and m.published = true and c.published = true
			""")
	Optional<CourseModule> findPublished(Long courseId, String slug);

}
