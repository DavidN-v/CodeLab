package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** A proposed correction of one file. It is only a proposal: the learner reviews it and decides. */
@Schema(name = "LabFix")
public record LabFixResponse(String path, String content, String explanation) {
}
