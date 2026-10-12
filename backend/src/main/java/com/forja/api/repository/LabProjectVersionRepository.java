package com.forja.api.repository;

import com.forja.api.entity.LabProjectVersion;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabProjectVersionRepository extends JpaRepository<LabProjectVersion, Long> {

	List<LabProjectVersion> findByProjectIdOrderByCreatedAtDesc(Long projectId);

	Optional<LabProjectVersion> findByIdAndProjectId(Long id, Long projectId);

}
