package com.forja.api.service;

import com.forja.api.dto.LanguageResponse;
import java.util.List;

public interface LanguageService {

	/** Every language in display order, including the ones not yet available. */
	List<LanguageResponse> findAll();

	/** @throws com.forja.api.exception.ResourceNotFoundException if no language has that slug */
	LanguageResponse findBySlug(String slug);

}
