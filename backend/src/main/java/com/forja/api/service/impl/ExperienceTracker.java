package com.forja.api.service.impl;

import com.forja.api.dto.CelebrationResponse;
import com.forja.api.dto.DashboardResponse.Level;
import com.forja.api.entity.CourseModule;
import com.forja.api.learning.LevelTable;
import com.forja.api.learning.XpPolicy;
import com.forja.api.mapper.RefMapper;
import com.forja.api.repository.ExerciseProgressRepository;
import com.forja.api.repository.ExerciseRepository;
import com.forja.api.repository.LessonProgressRepository;
import com.forja.api.repository.LessonRepository;
import java.time.Instant;
import org.springframework.stereotype.Component;

/**
 * Experience totals and the milestones they cross. Must be called inside a
 * transaction that already holds the change being celebrated.
 */
@Component
public class ExperienceTracker {

	private final LessonRepository lessonRepository;

	private final ExerciseRepository exerciseRepository;

	private final LessonProgressRepository lessonProgressRepository;

	private final ExerciseProgressRepository exerciseProgressRepository;

	private final RefMapper refMapper;

	public ExperienceTracker(LessonRepository lessonRepository, ExerciseRepository exerciseRepository,
			LessonProgressRepository lessonProgressRepository, ExerciseProgressRepository exerciseProgressRepository,
			RefMapper refMapper) {
		this.lessonRepository = lessonRepository;
		this.exerciseRepository = exerciseRepository;
		this.lessonProgressRepository = lessonProgressRepository;
		this.exerciseProgressRepository = exerciseProgressRepository;
		this.refMapper = refMapper;
	}

	public int totalXp(Long userId) {
		return (int) (lessonProgressRepository.countByUserId(userId) * XpPolicy.LESSON_XP
				+ exerciseProgressRepository.sumXp(userId));
	}

	/** Experience earned since an instant, e.g. the start of today. */
	public int xpSince(Long userId, Instant since) {
		return (int) (lessonProgressRepository.countByUserIdAndCompletedAtGreaterThanEqual(userId, since)
				* XpPolicy.LESSON_XP + exerciseProgressRepository.sumXpSolvedSince(userId, since));
	}

	/**
	 * What a first completion inside {@code module} achieved: a new level, the
	 * whole module, both or nothing (null).
	 */
	public CelebrationResponse celebrate(Long userId, int xpGained, CourseModule module) {
		int after = totalXp(userId);
		LevelTable.Level previous = LevelTable.levelFor(after - xpGained);
		LevelTable.Level current = LevelTable.levelFor(after);
		Level newLevel = current.number() > previous.number()
				? new Level(current.number(), current.title(), current.minXp(), current.nextLevelXp()) : null;
		boolean moduleDone = lessonProgressRepository.countCompletedInModule(userId, module.getId())
				>= lessonRepository.countByModuleIdAndPublishedTrue(module.getId())
				&& exerciseProgressRepository.countSolvedInModule(userId, module.getId())
						>= exerciseRepository.countByModuleIdAndPublishedTrue(module.getId());
		if (newLevel == null && !moduleDone) {
			return null;
		}
		return new CelebrationResponse(newLevel, moduleDone ? refMapper.toRef(module) : null);
	}

}
