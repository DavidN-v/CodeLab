package com.forja.api.learning;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * The lines of a parsons exercise as the learner receives them: the right
 * ones and the distractors, shuffled. The order depends only on the exercise,
 * so it does not change between visits, and it is never the solution itself.
 */
public final class ParsonsPuzzle {

	/** What is stored for a parsons exercise. */
	public record Data(List<String> lines, List<String> distractors) {
	}

	private ParsonsPuzzle() {
	}

	public static List<String> shuffled(String seed, Data data) {
		List<String> blocks = new ArrayList<>(data.lines());
		if (data.distractors() != null) {
			blocks.addAll(data.distractors());
		}
		Random random = new Random(seed.hashCode());
		for (int attempt = 0; attempt < 10; attempt++) {
			Collections.shuffle(blocks, random);
			if (!blocks.subList(0, data.lines().size()).equals(data.lines())) {
				break;
			}
		}
		return blocks;
	}

}
