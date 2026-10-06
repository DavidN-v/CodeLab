package com.forja.runner.execution;

import com.forja.runner.execution.HarnessOutput.Captured;
import com.forja.runner.execution.HarnessOutput.Run;
import com.forja.runner.execution.HarnessOutput.Step;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * Reads the line protocol written by {@code sandbox/harness.sh}. Lines that do
 * not fit the protocol are ignored, so a malformed or cut-off stream yields
 * whatever was complete instead of failing.
 */
final class HarnessOutputParser {

	private static final String MARKER = "@@FORJA ";

	private HarnessOutputParser() {
	}

	static HarnessOutput parse(byte[] raw) {
		String[] lines = new String(raw, StandardCharsets.US_ASCII).split("\n");
		Step compile = null;
		Captured compileOutput = Captured.EMPTY;
		List<Run> runs = new ArrayList<>();
		boolean complete = false;

		// The run being assembled: its header arrives first, then stdout, then stderr.
		Run pending = null;
		String section = null;
		long sectionBytes = 0;
		StringBuilder payload = new StringBuilder();

		for (String rawLine : lines) {
			String line = rawLine.strip();
			if (!line.startsWith(MARKER)) {
				if (section != null) {
					payload.append(line);
				}
				continue;
			}

			if (section != null) {
				Captured captured = decode(payload, sectionBytes);
				switch (section) {
					case "output" -> compileOutput = captured;
					case "stdout" -> pending = pending == null ? null : withStdout(pending, captured);
					case "stderr" -> {
						if (pending != null) {
							runs.add(withStderr(pending, captured));
							pending = null;
						}
					}
					default -> {
					}
				}
				section = null;
				payload.setLength(0);
			}

			String[] parts = line.substring(MARKER.length()).split(" ");
			try {
				switch (parts[0]) {
					case "compile" -> compile = new Step(Integer.parseInt(parts[1]), Long.parseLong(parts[2]));
					case "run" -> pending = new Run(Integer.parseInt(parts[1]), Integer.parseInt(parts[2]),
							Long.parseLong(parts[3]), Captured.EMPTY, Captured.EMPTY);
					case "output", "stdout", "stderr" -> {
						section = parts[0];
						sectionBytes = Long.parseLong(parts[1]);
					}
					case "end" -> complete = true;
					default -> {
					}
				}
			}
			catch (RuntimeException ex) {
				// Malformed protocol line: skip it.
				section = null;
			}
		}
		return new HarnessOutput(compile, compileOutput, List.copyOf(runs), complete);
	}

	private static Captured decode(StringBuilder base64, long totalBytes) {
		try {
			byte[] bytes = Base64.getMimeDecoder().decode(base64.toString());
			return new Captured(new String(bytes, StandardCharsets.UTF_8), totalBytes > bytes.length);
		}
		catch (IllegalArgumentException ex) {
			return Captured.EMPTY;
		}
	}

	private static Run withStdout(Run run, Captured stdout) {
		return new Run(run.index(), run.exitCode(), run.millis(), stdout, run.stderr());
	}

	private static Run withStderr(Run run, Captured stderr) {
		return new Run(run.index(), run.exitCode(), run.millis(), run.stdout(), stderr);
	}

}
