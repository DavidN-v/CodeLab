package com.forja.api.repository;

import com.forja.api.entity.Submission;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

	List<Submission> findByUserIdAndExerciseIdOrderByCreatedAtDesc(Long userId, Long exerciseId, Limit limit);

	@EntityGraph(attributePaths = "exercise")
	List<Submission> findByUserIdOrderByCreatedAtDesc(Long userId, Limit limit);

	long countByUserId(Long userId);

	@Query("select s.createdAt from Submission s where s.user.id = :userId and s.createdAt >= :since")
	List<Instant> findSubmissionTimesSince(Long userId, Instant since);

}
