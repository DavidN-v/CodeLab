package com.forja.api.learning;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class StaticCheckerTest {

	private static final String STARTER = """
			<h1>{{?}}</h1>
			<button ({{?}})="sumar()">+</button>
			""";

	private static final String SOLUTION = """
			<h1>{{ titulo() }}</h1>
			<button (click)="sumar()">+</button>
			""";

	@Test
	void acceptsTheSolutionIgnoringSpacingAndQuotes() {
		assertThat(StaticChecker.checkBlanks(STARTER, SOLUTION, List.of("{{titulo()}}", " click ")).right()).isTrue();
		assertThat(StaticChecker.checkBlanks("x = {{?}};", "x = 'a';", List.of("\"a\"")).right()).isTrue();
	}

	@Test
	void pointsAtTheWrongBlanks() {
		StaticChecker.Verdict verdict = StaticChecker.checkBlanks(STARTER, SOLUTION, List.of("{{ titulo }}", "click"));

		assertThat(verdict.right()).isFalse();
		assertThat(verdict.feedback()).isEqualTo("Revisa el hueco 1.");
	}

	@Test
	void checksTheOrderOfTheLines() {
		List<String> lines = List.of("import { Component } from '@angular/core';", "@Component({", "})");

		assertThat(StaticChecker.checkLines(lines, lines).right()).isTrue();
		assertThat(StaticChecker.checkLines(lines, List.of(lines.get(1), lines.get(0), lines.get(2))).feedback())
			.isEqualTo("La línea 1 no va ahí (o sobra).");
		assertThat(StaticChecker.checkLines(lines, lines.subList(0, 2)).feedback()).startsWith("Faltan líneas");
	}

}
