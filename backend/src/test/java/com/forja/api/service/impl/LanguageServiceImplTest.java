package com.forja.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.forja.api.dto.LanguageResponse;
import com.forja.api.entity.Language;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.mapper.LanguageMapper;
import com.forja.api.repository.LanguageRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LanguageServiceImplTest {

	@Mock
	private LanguageRepository languageRepository;

	private LanguageServiceImpl languageService;

	@BeforeEach
	void setUp() {
		languageService = new LanguageServiceImpl(languageRepository, new LanguageMapper());
	}

	@Test
	void findAllKeepsRepositoryOrderAndIncludesInactiveLanguages() {
		Language java = new Language("java", "Java", "21", "java", "Aprende Java.", null, true, 1);
		Language python = new Language("python", "Python", "3.13", "python", "Aprende Python.", null, false, 2);
		when(languageRepository.findAllByOrderByDisplayOrderAsc()).thenReturn(List.of(java, python));

		List<LanguageResponse> languages = languageService.findAll();

		assertThat(languages).extracting(LanguageResponse::slug).containsExactly("java", "python");
		assertThat(languages).extracting(LanguageResponse::active).containsExactly(true, false);
	}

	@Test
	void findBySlugMapsTheLanguage() {
		Language java = new Language("java", "Java", "21", "java", "Aprende Java.", "Descripción", true, 1);
		when(languageRepository.findBySlug("java")).thenReturn(Optional.of(java));

		LanguageResponse language = languageService.findBySlug("java");

		assertThat(language.name()).isEqualTo("Java");
		assertThat(language.version()).isEqualTo("21");
		assertThat(language.description()).isEqualTo("Descripción");
	}

	@Test
	void findBySlugFailsWhenTheLanguageDoesNotExist() {
		when(languageRepository.findBySlug("cobol")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> languageService.findBySlug("cobol")).isInstanceOf(ResourceNotFoundException.class)
			.hasMessageContaining("cobol");
	}

}
