package com.forja.runner.execution;

import static org.assertj.core.api.Assertions.assertThat;

import com.forja.runner.execution.HarnessOutput.Captured;
import com.forja.runner.execution.HarnessOutput.Run;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class HarnessOutputParserTest {

	@Test
	void decodesCompileStepAndEveryRun() {
		String raw = """
				@@FORJA compile 0 700
				@@FORJA output 0
				@@FORJA run 0 0 90
				@@FORJA stdout 8
				%s
				@@FORJA stderr 0
				@@FORJA run 1 1 70
				@@FORJA stdout 0
				@@FORJA stderr 5
				%s
				@@FORJA end
				""".formatted(base64("¡Hola!\n"), base64("fallo"));

		HarnessOutput output = HarnessOutputParser.parse(raw.getBytes(StandardCharsets.US_ASCII));

		assertThat(output.complete()).isTrue();
		assertThat(output.compile().exitCode()).isZero();
		assertThat(output.runs()).containsExactly(
				new Run(0, 0, 90, new Captured("¡Hola!\n", false), Captured.EMPTY),
				new Run(1, 1, 70, Captured.EMPTY, new Captured("fallo", false)));
	}

	@Test
	void flagsOutputThatWasCutShort() {
		String raw = "@@FORJA compile 0 1\n@@FORJA output 0\n@@FORJA run 0 0 5\n@@FORJA stdout 999\n"
				+ base64("abc") + "\n@@FORJA stderr 0\n@@FORJA end\n";

		Run run = HarnessOutputParser.parse(raw.getBytes(StandardCharsets.US_ASCII)).runs().get(0);

		assertThat(run.stdout()).isEqualTo(new Captured("abc", true));
	}

	@Test
	void keepsCompilerErrors() {
		String raw = "@@FORJA compile 1 650\n@@FORJA output 20\n" + base64("Main.java:1: error\n") + "\n@@FORJA end\n";

		HarnessOutput output = HarnessOutputParser.parse(raw.getBytes(StandardCharsets.US_ASCII));

		assertThat(output.compile().exitCode()).isEqualTo(1);
		assertThat(output.compileOutput().text()).isEqualTo("Main.java:1: error\n");
		assertThat(output.runs()).isEmpty();
	}

	@Test
	void returnsWhatWasCompleteWhenTheStreamStopsEarly() {
		String raw = "@@FORJA compile 0 1\n@@FORJA output 0\n@@FORJA run 0 0 5\n@@FORJA stdout 2\n"
				+ base64("ok") + "\n@@FORJA stderr 0\n@@FORJA run 1 137 5000\n@@FORJA std";

		HarnessOutput output = HarnessOutputParser.parse(raw.getBytes(StandardCharsets.US_ASCII));

		assertThat(output.complete()).isFalse();
		assertThat(output.runs()).hasSize(1);
	}

	@Test
	void ignoresLinesOutsideTheProtocol() {
		String raw = "basura\n@@FORJA compile x y\n@@FORJA compile 0 3\n@@FORJA output 0\n@@FORJA end\n";

		HarnessOutput output = HarnessOutputParser.parse(raw.getBytes(StandardCharsets.US_ASCII));

		assertThat(output.compile().millis()).isEqualTo(3);
		assertThat(output.complete()).isTrue();
	}

	private static String base64(String text) {
		return Base64.getMimeEncoder().encodeToString(text.getBytes(StandardCharsets.UTF_8));
	}

}
