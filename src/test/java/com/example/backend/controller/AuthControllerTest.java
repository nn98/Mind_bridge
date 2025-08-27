// src/test/java/com/example/backend/controller/AuthControllerTest.java
package com.example.backend.controller;

import com.example.backend.config.TestConfig;
import com.example.backend.dto.auth.FindIdRequest;
import com.example.backend.dto.auth.LoginRequest;
import com.example.backend.dto.auth.LoginResponse;
import com.example.backend.dto.auth.ResetPasswordRequest;
import com.example.backend.dto.user.Profile;
import com.example.backend.security.CustomUserDetailsService;
import com.example.backend.security.JwtUtil;
import com.example.backend.security.TestMailConfig;
import com.example.backend.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@Import({TestConfig.class, JwtUtil.class, TestMailConfig.class})
@WithMockUser(username = "test@example.com", roles = {"USER"})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("로그인 성공 테스트")
    void testLoginSuccess() throws Exception {
        // Given
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        Profile profile = new Profile();
        profile.setId(1L);
        profile.setEmail("test@example.com");

        LoginResponse response = new LoginResponse("jwt-token", profile);
        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("jwt-token"))
                .andExpect(jsonPath("$.data.profile.email").value("test@example.com"));

        verify(authService).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("로그인 실패 - 잘못된 인증정보")
    void testLoginFailureInvalidCredentials() throws Exception {
        // Given
        LoginRequest request = new LoginRequest();
        request.setEmail("wrong@example.com");
        request.setPassword("wrongpassword");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new RuntimeException("이메일 또는 비밀번호가 잘못되었습니다."));

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        verify(authService).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("로그아웃 테스트")
    void testLogout() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("아이디 찾기 성공")
    void testFindUserIdSuccess() throws Exception {
        // Given
        FindIdRequest request = new FindIdRequest();
        request.setPhoneNumber("01012345678");
        request.setNickname("testuser");

        when(authService.findAndMaskUserEmail(any(FindIdRequest.class)))
                .thenReturn("te***@example.com");

        // When & Then
        mockMvc.perform(post("/api/auth/find-id")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("te***@example.com"));

        verify(authService).findAndMaskUserEmail(any(FindIdRequest.class));
    }

    @Test
    @DisplayName("비밀번호 재설정 성공")
    void testResetPasswordSuccess() throws Exception {
        // Given
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setEmail("test@example.com");

        when(authService.resetPassword(any(ResetPasswordRequest.class)))
                .thenReturn(true);

        // When & Then
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(authService).resetPassword(any(ResetPasswordRequest.class));
    }
}
