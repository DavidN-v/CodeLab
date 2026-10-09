package com.forja.runner.docker;

import java.io.ByteArrayOutputStream;

/**
 * Decodes the multiplexed stream Docker returns for containers started without
 * a TTY: a sequence of frames, each with an 8-byte header (stream type, three
 * zero bytes, big-endian payload length) followed by the payload.
 */
final class DockerLogs {

	private static final int HEADER_LENGTH = 8;

	private static final int STDOUT = 1;

	private DockerLogs() {
	}

	/** Concatenated stdout payloads; stderr frames and a truncated last frame are skipped. */
	static byte[] stdout(byte[] multiplexed) {
		ByteArrayOutputStream stdout = new ByteArrayOutputStream(multiplexed.length);
		int position = 0;
		while (position + HEADER_LENGTH <= multiplexed.length) {
			int stream = multiplexed[position];
			int length = ((multiplexed[position + 4] & 0xff) << 24) | ((multiplexed[position + 5] & 0xff) << 16)
					| ((multiplexed[position + 6] & 0xff) << 8) | (multiplexed[position + 7] & 0xff);
			int start = position + HEADER_LENGTH;
			if (length < 0 || start + length > multiplexed.length) {
				break;
			}
			if (stream == STDOUT) {
				stdout.write(multiplexed, start, length);
			}
			position = start + length;
		}
		return stdout.toByteArray();
	}

}
