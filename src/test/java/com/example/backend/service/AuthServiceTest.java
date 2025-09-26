package com.example.backend.service;

import static org.assertj.core.api.AssertionsForClassTypes.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.backend.common.error.UnauthorizedException;
import com.example.backend.dto.auth.LoginRequest;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import com.github.dockerjava.api.model.AuthResponse;

import jakarta.servlet.http.HttpServletResponse;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

	@Mock private UserRepository userRepository;
	@Mock private PasswordEncoder passwordEncoder;
	@Mock private JwtUtil jwtUtil;
	@Mock private DailyMetricsService dailyMetricsService;

	@InjectMocks private AuthService authService;

	@Test
	@DisplayName("유효한 로그인 정보로 인증 성공")
	void loginAndSetCookie_WithValidCredentials_ShouldAuthenticateSuccessfully() {
		// Given
		LoginRequest request = new LoginRequest("test@example.com", "password123");
		UserEntity mockUser = UserEntity.builder()
			.email("test@example.com")
			.password("encodedPassword")
			.build();

		when(userRepository.findByEmail("test@example.com"))
			.thenReturn(Optional.of(mockUser));
		when(passwordEncoder.matches("password123", "encodedPassword"))
			.thenReturn(true);
		when(jwtUtil.generateToken("test@example.com"))
			.thenReturn("mock-jwt-token");

		HttpServletResponse response = mock(HttpServletResponse.class);

		// When
		authService.loginAndSetCookie(request, response);

		// Then
		verify(jwtUtil).setJwtCookie(response, "mock-jwt-token");
		verify(userRepository).touchLastLogin("test@example.com");
		verify(dailyMetricsService).increaseUserCount();
	}

	@Test
	@DisplayName("잘못된 비밀번호로 로그인 실패")
	void authenticateUser_WithWrongPassword_ShouldThrowUnauthorizedException() {
		// Given
		LoginRequest request = new LoginRequest("test@example.com", "wrongPassword");
		UserEntity mockUser = UserEntity.builder()
			.email("test@example.com")
			.password("encodedPassword")
			.build();

		when(userRepository.findByEmail("test@example.com"))
			.thenReturn(Optional.of(mockUser));
		when(passwordEncoder.matches("wrongPassword", "encodedPassword"))
			.thenReturn(false);

		HttpServletResponse response = mock(HttpServletResponse.class);

		// When & Then
		assertThatThrownBy(() -> authService.loginAndSetCookie(request, response))
			.isInstanceOf(UnauthorizedException.class)
			.hasMessage("이메일 또는 비밀번호가 잘못되었습니다.");
	}
}
