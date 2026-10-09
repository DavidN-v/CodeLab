package com.forja.api.dto;

import com.forja.api.util.SlugRules;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(name = "ExecutionRequest", description = "A program to run once in the playground.")
public record ExecutionRequest(
		@Schema(example = "java") @NotBlank(message = "es obligatorio") @Pattern(regexp = SlugRules.PATTERN, message = SlugRules.MESSAGE) String languageSlug,
		@Schema(example = "public class Main { public static void main(String[] a) { System.out.println(\"Hola\"); } }") @NotBlank(message = "no puede estar vacío") @Size(max = 65536, message = "admite hasta 64 KB") String sourceCode,
		@Schema(description = "Standard input; empty if the program reads nothing.") @NotNull(message = "es obligatorio") @Size(max = 16384, message = "admite hasta 16 KB") String stdin) {
}
