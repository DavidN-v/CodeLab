package com.forja.runner.execution;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class JavaSourceLayoutTest {

	private final JavaSourceLayout layout = new JavaSourceLayout();

	@Test
	void namesTheFileAfterThePublicClass() {
		SourceFile file = layout.resolve("""
				import java.util.List;

				public class Saludo {
				    public static void main(String[] args) {}
				}
				""");

		assertThat(file).isEqualTo(new SourceFile("Saludo.java", "Saludo"));
	}

	@Test
	void startsFromTheFirstTypeWhenNoneIsPublic() {
		SourceFile file = layout.resolve("""
				class Programa {
				    public static void main(String[] args) {}
				}

				class Ayudante {}
				""");

		assertThat(file).isEqualTo(new SourceFile("Main.java", "Programa"));
	}

	@Test
	void prefixesThePackage() {
		SourceFile file = layout.resolve("package com.ejemplo.app;\n\npublic final class App {}");

		assertThat(file).isEqualTo(new SourceFile("App.java", "com.ejemplo.app.App"));
	}

	@Test
	void ignoresTypesMentionedInComments() {
		SourceFile file = layout.resolve("""
				// public class Falsa {}
				/* class TampocoEsta {} */
				public record Punto(int x, int y) {
				    public static void main(String[] args) {}
				}
				""");

		assertThat(file).isEqualTo(new SourceFile("Punto.java", "Punto"));
	}

	@Test
	void fallsBackToMainForCodeWithoutTypes() {
		assertThat(layout.resolve("System.out.println(1);")).isEqualTo(new SourceFile("Main.java", "Main"));
	}

}
