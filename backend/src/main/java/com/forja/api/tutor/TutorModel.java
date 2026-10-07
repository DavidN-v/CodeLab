package com.forja.api.tutor;

/** Something that answers a tutoring prompt. Replaced by a fake in tests. */
public interface TutorModel {

	/**
	 * @param system who the tutor is and how it answers
	 * @param prompt the learner's situation and request
	 * @return the answer in CommonMark, or null when the model declined
	 */
	String answer(String system, String prompt);

}
