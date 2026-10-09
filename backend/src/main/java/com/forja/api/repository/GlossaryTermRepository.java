package com.forja.api.repository;

import com.forja.api.entity.GlossaryTerm;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GlossaryTermRepository extends JpaRepository<GlossaryTerm, Long> {

	List<GlossaryTerm> findByCourseIdOrderByDisplayOrderAsc(Long courseId);

	List<GlossaryTerm> findByCourseId(Long courseId);

}
