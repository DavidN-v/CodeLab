package com.forja.api.mapper;

import com.forja.api.dto.LanguageResponse;
import com.forja.api.entity.Language;
import org.springframework.stereotype.Component;

@Component
public class LanguageMapper {

	public LanguageResponse toResponse(Language language) {
		return new LanguageResponse(language.getId(), language.getSlug(), language.getName(),
				language.getVersion(), language.getIcon(), language.getTagline(), language.getDescription(),
				language.isActive());
	}

}
