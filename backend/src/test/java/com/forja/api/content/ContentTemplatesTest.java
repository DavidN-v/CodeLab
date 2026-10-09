package com.forja.api.content;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class ContentTemplatesTest {

	@Test
	void fillsEachBlankWithItsAnswerInOrder() {
		String template = "for (int i = {{?}}; i {{?}} 5; i++)";

		assertThat(ContentTemplates.countBlanks(template)).isEqualTo(2);
		assertThat(ContentTemplates.fill(template, List.of("0", "<"))).isEqualTo("for (int i = 0; i < 5; i++)");
	}

	@Test
	void aMissingAnswerLeavesTheBlankEmpty() {
		assertThat(ContentTemplates.fill("a{{?}}b{{?}}c", List.of("1"))).isEqualTo("a1bc");
	}

	@Test
	void assemblesTheLinesWhereTheMarkerIs() {
		String template = "class Main {\n    {{lines}}\n}\n";

		assertThat(ContentTemplates.countLinesMarkers(template)).isEqualTo(1);
		assertThat(ContentTemplates.assemble(template, List.of("  int a;", "  int b;")))
			.isEqualTo("class Main {\n  int a;\n  int b;\n}\n");
	}

}
