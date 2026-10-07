package com.forja.api.repository;

import com.forja.api.entity.ExerciseProgress;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExerciseProgressRepository extends JpaRepository<ExerciseProgress, Long> {

	Optional<ExerciseProgress> findByUserIdAndExerciseId(Long userId, Long exerciseId);

	@EntityGraph(attributePaths = { "exercise", "exercise.module" })
	List<ExerciseProgress> findByUserId(Long userId);

	@Query("select coalesce(sum(p.xpAwarded), 0) from ExerciseProgress p where p.user.id = :userId")
	long sumXp(Long userId);

	@Query("""
			select coalesce(sum(p.xpAwarded), 0) from ExerciseProgress p
			where p.user.id = :userId and p.solvedAt >= :since
			""")
	long sumXpSolvedSince(Long userId, Instant since);

	@Query("""
			select count(p) from ExerciseProgress p
			where p.user.id = :userId and p.exercise.module.id = :moduleId and p.exercise.published = true
				and p.solvedAt is not null
			""")
	long countSolvedInModule(Long userId, Long moduleId);

	/** Solved exercises due for review, the most overdue first. */
	@Query("""
			select p from ExerciseProgress p join fetch p.exercise e join fetch e.module m
			where p.user.id = :userId and p.nextReviewAt <= :now and e.published = true and m.published = true
			order by p.nextReviewAt
			""")
	List<ExerciseProgress> findDueReviews(Long userId, Instant now, Limit limit);

	@Query("""
			select count(p) from ExerciseProgress p
			where p.user.id = :userId and p.nextReviewAt <= :now and p.exercise.published = true
			""")
	long countDueReviews(Long userId, Instant now);

}
