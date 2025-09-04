// src/test/java/com/example/backend/controller/UserControllerTest.java
package com.example.backend.controller;

import com.example.backend.api.controller.UserController;
import com.example.backend.config.TestConfig;
import com.example.backend.api.dto.user.Profile;
import com.example.backend.api.dto.user.RegistrationRequest;
import com.example.backend.api.dto.user.UpdateRequest;
import com.example.backend.infrastructure.security.CustomUserDetailsService;
import com.example.backend.security.JwtUtilTest;
import com.example.backend.infrastructure.security.TestMailConfig;
import com.example.backend.application.service.UserService;
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

import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@Import({TestConfig.class, JwtUtilTest.class, TestMailConfig.class})
@WithMockUser(username = "test@example.com", roles = {"USER"})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("회원가입 성공")
    void testRegisterSuccess() throws Exception {
        // Given
        RegistrationRequest request = new RegistrationRequest();
        request.setEmail("newuser@example.com");
        request.setPassword("password123");
        request.setNickname("newuser");
        request.setGender("M");
        request.setAge(25);

        Profile profile = new Profile();
        profile.setId(1L);
        profile.setEmail("newuser@example.com");
        profile.setNickname("newuser");

        when(userService.register(any(RegistrationRequest.class))).thenReturn(profile);

        // When & Then
        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.data.nickname").value("newuser"));

        verify(userService).register(any(RegistrationRequest.class));
    }

    @Test
    @DisplayName("이메일 중복 확인 - 사용 가능")
    void testCheckEmailAvailable() throws Exception {
        // Given
        when(userService.isEmailAvailable("available@example.com")).thenReturn(true);

        // When & Then
        mockMvc.perform(get("/api/users/check-email")
                        .param("email", "available@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isAvailable").value(true));

        verify(userService).isEmailAvailable("available@example.com");
    }

    @Test
    @DisplayName("사용자 프로필 조회 성공")
    @WithMockUser(username = "test@example.com")
    void testGetUserProfileSuccess() throws Exception {
        // Given
        Profile profile = new Profile();
        profile.setId(1L);
        profile.setEmail("test@example.com");
        profile.setNickname("testuser");

        when(userService.getUserByEmail("test@example.com"))
                .thenReturn(Optional.of(profile));

        // When & Then
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.nickname").value("testuser"));

        verify(userService).getUserByEmail("test@example.com");
    }

    @Test
    @DisplayName("사용자 정보 수정 성공")
    @WithMockUser(username = "test@example.com")
    void testUpdateUserSuccess() throws Exception {
        // Given
        UpdateRequest request = new UpdateRequest();
        request.setNickname("updatednick");
        request.setMentalState("good");

        Profile updatedProfile = new Profile();
        updatedProfile.setId(1L);
        updatedProfile.setEmail("test@example.com");
        updatedProfile.setNickname("updatednick");
        updatedProfile.setMentalState("good");

        when(userService.updateUser(eq("test@example.com"), any(UpdateRequest.class)))
                .thenReturn(updatedProfile);

        // When & Then
        mockMvc.perform(put("/api/users/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nickname").value("updatednick"))
                .andExpect(jsonPath("$.data.mentalState").value("good"));

        verify(userService).updateUser(eq("test@example.com"), any(UpdateRequest.class));
    }

    @Test
    @DisplayName("비밀번호 변경 성공")
    @WithMockUser(username = "test@example.com")
    void testChangePasswordSuccess() throws Exception {
        // Given
        Map<String, String> request = Map.of("newPassword", "newpassword123");

        Profile updatedProfile = new Profile();
        updatedProfile.setEmail("test@example.com");

        when(userService.changePassword("test@example.com", "newpassword123"))
                .thenReturn(updatedProfile);

        // When & Then
        mockMvc.perform(put("/api/users/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(userService).changePassword("test@example.com", "newpassword123");
    }
}
