package com.forja.api.repository;

import com.forja.api.entity.CourseModule;
import java.util.List;
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

	/** Course title and module title of everything published, in reading order. */
	@Query("""
			select c.title, m.title from CourseModule m join m.course c
			where m.published = true and c.published = true
			order by c.displayOrder, m.displayOrder
			""")
	List<Object[]> findPublishedTitles();

}
