package com.forja.api.learning;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class OutputComparatorTest {

	@Test
	void ignoresLineEndingsTrailingSpacesAndTrailingBlankLines() {
		assertThat(OutputComparator.matches("Hola\nmundo\n", "Hola  \r\nmundo\r\n\n\n")).isTrue();
		assertThat(OutputComparator.matches("Hola", "Hola\n")).isTrue();
		assertThat(OutputComparator.matches("", "\n")).isTrue();
	}

	@Test
	void keepsEverythingElseSignificant() {
		assertThat(OutputComparator.matches("Hola mundo", "Hola  mundo")).isFalse();
		assertThat(OutputComparator.matches("Hola", "hola")).isFalse();
		assertThat(OutputComparator.matches("a\nb", "a\n\nb")).isFalse();
		assertThat(OutputComparator.matches("  sangría", "sangría")).isFalse();
	}

	@Test
	void treatsMissingOutputAsEmpty() {
		assertThat(OutputComparator.matches("", null)).isTrue();
		assertThat(OutputComparator.matches("algo", null)).isFalse();
	}

}
