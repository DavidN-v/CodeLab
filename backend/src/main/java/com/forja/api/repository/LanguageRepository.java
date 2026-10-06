package com.forja.api.repository;

import com.forja.api.entity.Language;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LanguageRepository extends JpaRepository<Language, Long> {

	List<Language> findAllByOrderByDisplayOrderAsc();

	Optional<Language> findBySlug(String slug);

}
