package com.forja.api.service;

import com.forja.api.dto.AuthResponse;
import com.forja.api.dto.LoginRequest;
import com.forja.api.dto.RegisterRequest;
import com.forja.api.dto.UserResponse;

public interface AuthService {

	/** @throws com.forja.api.exception.ConflictException if the email is already registered */
	AuthResponse register(RegisterRequest request);

	/** @throws com.forja.api.exception.InvalidCredentialsException if email or password are wrong */
	AuthResponse login(LoginRequest request);

	UserResponse findUser(Long userId);

	UserResponse changeDailyGoal(Long userId, int dailyGoalXp);

}
