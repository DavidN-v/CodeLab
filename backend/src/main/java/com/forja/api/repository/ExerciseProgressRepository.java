package com.forja.api.repository;

import com.forja.api.entity.ExerciseProgress;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExerciseProgressRepository extends JpaRepository<ExerciseProgress, Long> {

	Optional<ExerciseProgress> findByUserIdAndExerciseId(Long userId, Long exerciseId);

	@EntityGraph(attributePaths = { "exercise", "exercise.module" })
	List<ExerciseProgress> findByUserId(Long userId);

}
