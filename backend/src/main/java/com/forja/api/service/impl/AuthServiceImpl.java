package com.forja.api.service.impl;

import com.forja.api.dto.AuthResponse;
import com.forja.api.dto.LoginRequest;
import com.forja.api.dto.RegisterRequest;
import com.forja.api.dto.UserResponse;
import com.forja.api.entity.User;
import com.forja.api.exception.ConflictException;
import com.forja.api.exception.InvalidCredentialsException;
import com.forja.api.exception.ResourceNotFoundException;
import com.forja.api.repository.UserRepository;
import com.forja.api.security.TokenService;
import com.forja.api.security.TokenService.IssuedToken;
import com.forja.api.service.AuthService;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

	/**
	 * Compared against when the email is unknown, so a failed login takes as long
	 * whether or not the account exists.
	 */
	private final String dummyHash;

	private final UserRepository userRepository;

	private final PasswordEncoder passwordEncoder;

	private final TokenService tokenService;

	public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, TokenService tokenService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.tokenService = tokenService;
		this.dummyHash = passwordEncoder.encode("forja-timing-equaliser");
	}

	@Override
	public AuthResponse register(RegisterRequest request) {
		String email = normalizeEmail(request.email());
		if (userRepository.existsByEmail(email)) {
			throw new ConflictException("Ya existe una cuenta con ese correo.");
		}
		User user;
		try {
			user = userRepository.saveAndFlush(
					new User(email, request.displayName().strip(), passwordEncoder.encode(request.password())));
		}
		catch (DataIntegrityViolationException ex) {
			// Two sign-ups with the same email at the same moment.
			throw new ConflictException("Ya existe una cuenta con ese correo.");
		}
		return authResponse(user);
	}

	@Override
	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest request) {
		User user = userRepository.findByEmail(normalizeEmail(request.email())).orElse(null);
		String hash = user == null ? dummyHash : user.getPasswordHash();
		boolean matches = passwordEncoder.matches(request.password(), hash);
		if (user == null || !matches) {
			throw new InvalidCredentialsException();
		}
		return authResponse(user);
	}

	@Override
	@Transactional(readOnly = true)
	public UserResponse findUser(Long userId) {
		return userRepository.findById(userId)
			.map(AuthServiceImpl::toResponse)
			.orElseThrow(() -> new ResourceNotFoundException("La cuenta ya no existe."));
	}

	@Override
	@Transactional
	public UserResponse changeDailyGoal(Long userId, int dailyGoalXp) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new ResourceNotFoundException("La cuenta ya no existe."));
		user.changeDailyGoal(dailyGoalXp);
		return toResponse(user);
	}

	private AuthResponse authResponse(User user) {
		IssuedToken token = tokenService.issue(user);
		return new AuthResponse(token.value(), token.expiresAt(), toResponse(user));
	}

	static UserResponse toResponse(User user) {
		return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getDailyGoalXp());
	}

	private static String normalizeEmail(String email) {
		return email.strip().toLowerCase(Locale.ROOT);
	}

}
