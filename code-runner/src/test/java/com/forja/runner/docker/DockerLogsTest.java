package com.forja.runner.docker;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class DockerLogsTest {

	@Test
	void keepsStdoutFramesInOrderAndDropsStderr() {
		byte[] stream = concat(frame(1, "uno "), frame(2, "error"), frame(1, "dos"));

		assertThat(new String(DockerLogs.stdout(stream), StandardCharsets.UTF_8)).isEqualTo("uno dos");
	}

	@Test
	void stopsAtATruncatedFrame() {
		byte[] complete = frame(1, "completo");
		byte[] cut = frame(1, "cortado");
		byte[] stream = concat(complete, java.util.Arrays.copyOf(cut, cut.length - 3));

		assertThat(new String(DockerLogs.stdout(stream), StandardCharsets.UTF_8)).isEqualTo("completo");
	}

	private static byte[] frame(int streamType, String payload) {
		byte[] data = payload.getBytes(StandardCharsets.UTF_8);
		byte[] frame = new byte[8 + data.length];
		frame[0] = (byte) streamType;
		frame[4] = (byte) (data.length >>> 24);
		frame[5] = (byte) (data.length >>> 16);
		frame[6] = (byte) (data.length >>> 8);
		frame[7] = (byte) data.length;
		System.arraycopy(data, 0, frame, 8, data.length);
		return frame;
	}

	private static byte[] concat(byte[]... parts) {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		for (byte[] part : parts) {
			out.writeBytes(part);
		}
		return out.toByteArray();
	}

}
