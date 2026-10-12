package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(name = "LabVersionRequest")
public record LabVersionRequest(@Size(max = 120, message = "admite hasta 120 caracteres") String label) {
}
