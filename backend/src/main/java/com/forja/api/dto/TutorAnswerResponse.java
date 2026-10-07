package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "TutorAnswer")
public record TutorAnswerResponse(@Schema(description = "The tutor's answer, in CommonMark.") String answer) {
}
