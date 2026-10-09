package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Solution")
public record SolutionResponse(String solutionCode) {
}
