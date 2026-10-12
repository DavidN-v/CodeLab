package com.forja.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(name = "LabFolderRequest", description = "The folder a project goes to; empty to take it out of any folder.")
public record LabFolderRequest(@Size(max = 60, message = "admite hasta 60 caracteres") String folder) {
}
