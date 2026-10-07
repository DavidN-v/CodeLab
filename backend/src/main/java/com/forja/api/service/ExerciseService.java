package com.forja.api.service;

import com.forja.api.dto.ExerciseDetailResponse;
import com.forja.api.dto.ExerciseProgressResponse;
import com.forja.api.dto.SolutionResponse;
import com.forja.api.dto.SubmissionRequest;
import com.forja.api.dto.SubmissionResultResponse;

public interface ExerciseService {

	/** @throws com.forja.api.exception.ResourceNotFoundException if no published exercise has that slug */
	ExerciseDetailResponse findBySlug(String slug);

	ExerciseProgressResponse findProgress(Long userId, String slug);

	/** Reveals the next hint, if any are left, and returns the updated progress. */
	ExerciseProgressResponse revealHint(Long userId, String slug);

	/** Returns the reference solution; solving afterwards no longer earns experience. */
	SolutionResponse revealSolution(Long userId, String slug);

	/**
	 * Runs the code against every test case, records the attempt and, on the
	 * first correct one, the solve and its experience.
	 */
	SubmissionResultResponse submit(Long userId, String slug, SubmissionRequest request);

}
