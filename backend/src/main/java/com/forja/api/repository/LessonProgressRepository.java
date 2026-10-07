package com.forja.api.repository;

import com.forja.api.entity.LessonProgress;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

	Optional<LessonProgress> findByUserIdAndLessonId(Long userId, Long lessonId);

	@EntityGraph(attributePaths = { "lesson", "lesson.module" })
	List<LessonProgress> findByUserId(Long userId);

	@Query("select p.completedAt from LessonProgress p where p.user.id = :userId and p.completedAt >= :since")
	List<Instant> findCompletionTimesSince(Long userId, Instant since);

	long countByUserId(Long userId);

	long countByUserIdAndCompletedAtGreaterThanEqual(Long userId, Instant since);

	@Query("""
			select count(p) from LessonProgress p
			where p.user.id = :userId and p.lesson.module.id = :moduleId and p.lesson.published = true
			""")
	long countCompletedInModule(Long userId, Long moduleId);

}
