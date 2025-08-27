// src/test/java/com/example/backend/service/AuthServiceTest.java
package com.example.backend.service;

import com.example.backend.dto.auth.FindIdRequest;
import com.example.backend.dto.auth.LoginRequest;
import com.example.backend.dto.auth.LoginResponse;
import com.example.backend.dto.auth.ResetPasswordRequest;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("로그인 성공")
    void testLoginSuccess() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        UserEntity user = new UserEntity();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setPassword("encoded-password");
        user.setNickname("testuser");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
        when(jwtUtil.generateToken("test@example.com")).thenReturn("jwt-token");

        // When
        LoginResponse result = authService.login(request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAccessToken()).isEqualTo("jwt-token");
        assertThat(result.getProfile().getEmail()).isEqualTo("test@example.com");

        verify(userRepository).findByEmail("test@example.com");
        verify(passwordEncoder).matches("password123", "encoded-password");
        verify(jwtUtil).generateToken("test@example.com");
    }

    @Test
    @DisplayName("로그인 실패 - 존재하지 않는 사용자")
    void testLoginFailureUserNotFound() {
        // Given
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@example.com");
        request.setPassword("password123");

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AuthService.AuthenticationException.class)
                .hasMessage("이메일 또는 비밀번호가 잘못되었습니다.");

        verify(userRepository).findByEmail("nonexistent@example.com");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(jwtUtil, never()).generateToken(anyString());
    }

    @Test
    @DisplayName("아이디 찾기 성공")
    void testFindAndMaskUserEmailSuccess() {
        // Given
        FindIdRequest request = new FindIdRequest();
        request.setPhoneNumber("01012345678");
        request.setNickname("testuser");

        UserEntity user = new UserEntity();
        user.setEmail("testuser@example.com");

        when(userRepository.findByPhoneNumberAndNickname("01012345678", "testuser"))
                .thenReturn(Optional.of(user));

        // When
        String result = authService.findAndMaskUserEmail(request);

        // Then
        assertThat(result).isEqualTo("te*******@example.com");

        verify(userRepository).findByPhoneNumberAndNickname("01012345678", "testuser");
    }

    @Test
    @DisplayName("비밀번호 재설정 성공")
    void testResetPasswordSuccess() {
        // Given
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("test@example.com");

        UserEntity user = new UserEntity();
        user.setEmail("test@example.com");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-temp-password");
        when(userRepository.save(any(UserEntity.class))).thenReturn(user);
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        // When
        boolean result = authService.resetPassword(request);

        // Then
        assertThat(result).isTrue();

        verify(userRepository).findByEmail("test@example.com");
        verify(passwordEncoder).encode(anyString());
        verify(userRepository).save(any(UserEntity.class));
        verify(mailSender).send(any(SimpleMailMessage.class));
    }
}
