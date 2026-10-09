package com.forja.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User extends BaseEntity {

	public static final int DEFAULT_DAILY_GOAL_XP = 30;

	/** Always lower case; see the constraint in the schema. */
	@Column(nullable = false, unique = true, length = 254)
	private String email;

	@Column(name = "display_name", nullable = false, length = 60)
	private String displayName;

	@Column(name = "password_hash", nullable = false, length = 100)
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Role role;

	/** Experience per day the learner aims for. */
	@Column(name = "daily_goal_xp", nullable = false)
	private int dailyGoalXp = DEFAULT_DAILY_GOAL_XP;

	protected User() {
	}

	public User(String email, String displayName, String passwordHash) {
		this.email = email;
		this.displayName = displayName;
		this.passwordHash = passwordHash;
		this.role = Role.STUDENT;
	}

	public String getEmail() {
		return email;
	}

	public String getDisplayName() {
		return displayName;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public Role getRole() {
		return role;
	}

	public int getDailyGoalXp() {
		return dailyGoalXp;
	}

	public void changeDailyGoal(int xp) {
		this.dailyGoalXp = xp;
	}

}
