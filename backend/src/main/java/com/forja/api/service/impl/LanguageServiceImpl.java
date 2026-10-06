package com.forja.api.service.impl;

import com.forja.api.dto.LanguageResponse;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.mapper.LanguageMapper;
import com.forja.api.repository.LanguageRepository;
import com.forja.api.service.LanguageService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class LanguageServiceImpl implements LanguageService {

	private final LanguageRepository languageRepository;

	private final LanguageMapper languageMapper;

	public LanguageServiceImpl(LanguageRepository languageRepository, LanguageMapper languageMapper) {
		this.languageRepository = languageRepository;
		this.languageMapper = languageMapper;
	}

	@Override
	public List<LanguageResponse> findAll() {
		return languageRepository.findAllByOrderByDisplayOrderAsc().stream().map(languageMapper::toResponse).toList();
	}

	@Override
	public LanguageResponse findBySlug(String slug) {
		return languageRepository.findBySlug(slug)
			.map(languageMapper::toResponse)
			.orElseThrow(() -> new ResourceNotFoundException("No existe el lenguaje '%s'.".formatted(slug)));
	}

}
