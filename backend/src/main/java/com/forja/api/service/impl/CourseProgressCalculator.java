package com.forja.api.service.impl;

import com.forja.api.dto.CourseProgressResponse;
import com.forja.api.dto.ModuleProgressResponse;
import com.forja.api.mapper.RefMapper;
import com.forja.api.repository.ExerciseOutline;
import com.forja.api.repository.LessonOutline;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/** Combines a course's outline with what a learner has done. Shared by the progress and dashboard services. */
@Component
class CourseProgressCalculator {

	private final RefMapper refMapper;

	CourseProgressCalculator(RefMapper refMapper) {
		this.refMapper = refMapper;
	}

	CourseProgressResponse calculate(Long courseId, List<LessonOutline> lessons, List<ExerciseOutline> exercises,
			Set<Long> completedLessonIds, Set<Long> solvedExerciseIds, Set<Long> attemptedExerciseIds) {
		Map<Long, int[]> counts = new LinkedHashMap<>();
		Map<Long, String> moduleSlugs = new LinkedHashMap<>();
		List<Long> completed = new ArrayList<>();
		LessonOutline nextLesson = null;
		for (LessonOutline lesson : lessons) {
			int[] count = counts.computeIfAbsent(lesson.moduleId(), id -> new int[4]);
			moduleSlugs.putIfAbsent(lesson.moduleId(), lesson.moduleSlug());
			count[1]++;
			if (completedLessonIds.contains(lesson.id())) {
				count[0]++;
				completed.add(lesson.id());
			}
			else if (nextLesson == null) {
				nextLesson = lesson;
			}
		}

		List<String> solved = new ArrayList<>();
		List<String> attempted = new ArrayList<>();
		for (ExerciseOutline exercise : exercises) {
			int[] count = counts.computeIfAbsent(exercise.moduleId(), id -> new int[4]);
			moduleSlugs.putIfAbsent(exercise.moduleId(), exercise.moduleSlug());
			count[3]++;
			if (solvedExerciseIds.contains(exercise.id())) {
				count[2]++;
				solved.add(exercise.slug());
			}
			else if (attemptedExerciseIds.contains(exercise.id())) {
				attempted.add(exercise.slug());
			}
		}

		List<ModuleProgressResponse> modules = counts.entrySet()
			.stream()
			.map(entry -> {
				int[] count = entry.getValue();
				return new ModuleProgressResponse(entry.getKey(), moduleSlugs.get(entry.getKey()), count[0], count[1],
						count[2], count[3], count[0] == count[1] && count[2] == count[3]);
			})
			.toList();
		int total = lessons.size() + exercises.size();
		int done = completed.size() + solved.size();
		int percent = total == 0 ? 0 : (int) Math.floor(done * 100.0 / total);
		return new CourseProgressResponse(courseId, completed.size(), lessons.size(), solved.size(), exercises.size(),
				percent, completed, solved, attempted, modules, refMapper.toRef(nextLesson));
	}

}
