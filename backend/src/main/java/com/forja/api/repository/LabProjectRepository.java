package com.forja.api.repository;

import com.forja.api.entity.LabProject;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabProjectRepository extends JpaRepository<LabProject, Long> {

	List<LabProject> findByUserIdOrderByUpdatedAtDesc(Long userId);

	/** Finds a project only when it belongs to that learner. */
	Optional<LabProject> findByIdAndUserId(Long id, Long userId);

	long countByUserId(Long userId);

}
