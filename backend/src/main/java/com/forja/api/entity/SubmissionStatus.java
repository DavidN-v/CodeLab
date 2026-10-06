package com.forja.api.entity;

/** Verdict of a submission. The first failing test case decides between the failure kinds. */
public enum SubmissionStatus {

	ACCEPTED, WRONG_ANSWER, COMPILATION_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED

}
