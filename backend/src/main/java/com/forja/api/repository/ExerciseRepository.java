package com.forja.api.repository;

import com.forja.api.entity.Exercise;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

	Optional<Exercise> findBySlug(String slug);

	List<Exercise> findByModuleId(Long moduleId);

	@Query("""
			select e from Exercise e join fetch e.module m join fetch m.course c join fetch c.language
			where e.slug = :slug and e.published = true and m.published = true and c.published = true
			""")
	Optional<Exercise> findPublishedBySlug(String slug);

	/** Published exercises of a course in practice order: by module, then by exercise. */
	@Query("""
			select new com.forja.api.repository.ExerciseOutline(e.id, e.slug, e.title, e.summary, e.difficulty,
				e.displayOrder, m.id, m.slug, m.title, m.displayOrder)
			from Exercise e join e.module m
			where m.course.id = :courseId and e.published = true and m.published = true
			order by m.displayOrder, e.displayOrder
			""")
	List<ExerciseOutline> findOutlinesByCourse(Long courseId);

}
