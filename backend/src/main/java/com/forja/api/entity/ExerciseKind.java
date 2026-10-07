package com.forja.api.entity;

/** What the learner does in an exercise. Every kind is graded by running tests, except PREDICT. */
public enum ExerciseKind {

	/** Write the program. */
	CODE,
	/** Repair a program that does not work. */
	FIX,
	/** Complete the blanks of a program. */
	FILL,
	/** Put shuffled lines in order. */
	PARSONS,
	/** Write what a program prints; compared with the expected output, nothing runs. */
	PREDICT,
	/** A larger program that closes a block of modules. */
	PROJECT

}
