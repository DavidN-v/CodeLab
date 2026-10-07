package com.forja.api.repository;

import com.forja.api.entity.Lesson;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

	List<Lesson> findByModuleId(Long moduleId);

	long countByModuleIdAndPublishedTrue(Long moduleId);

	/** Published lessons of a course in reading order: by module, then by lesson. */
	@Query("""
			select new com.forja.api.repository.LessonOutline(l.id, l.slug, l.title, l.summary, l.estimatedMinutes,
				l.displayOrder, m.id, m.slug, m.title, m.displayOrder)
			from Lesson l join l.module m
			where m.course.id = :courseId and l.published = true and m.published = true
			order by m.displayOrder, l.displayOrder
			""")
	List<LessonOutline> findOutlinesByCourse(Long courseId);

	@Query("""
			select l from Lesson l join fetch l.module m join fetch m.course c join fetch c.language
			where c.id = :courseId and m.slug = :moduleSlug and l.slug = :lessonSlug
				and l.published = true and m.published = true and c.published = true
			""")
	Optional<Lesson> findPublished(Long courseId, String moduleSlug, String lessonSlug);

	@Query("""
			select l from Lesson l join fetch l.module m join fetch m.course
			where l.id = :id and l.published = true and m.published = true
			""")
	Optional<Lesson> findPublishedById(Long id);

}
