// src/test/java/com/example/backend/controller/AuthControllerIntegrationTest.java
package com.example.backend.controller;

import com.example.backend.config.TestConfig;
import com.example.backend.dto.auth.LoginRequest;
import com.example.backend.dto.user.RegistrationRequest;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import com.example.backend.security.TestMailConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Transactional
@WithMockUser(username = "test@example.com", roles = {"USER"})
@Import({TestConfig.class, JwtUtil.class, TestMailConfig.class})
class AuthControllerIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("전체 로그인 플로우 통합 테스트")
    void testCompleteLoginFlow() {
        // Given - 사용자 생성
        UserEntity user = new UserEntity();
        user.setEmail("integration@example.com");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setNickname("integrationuser");
        user.setRole("USER");
        user.setAge(25);
        user.setGender("M");
        userRepository.save(user);

        LoginRequest request = new LoginRequest();
        request.setEmail("integration@example.com");
        request.setPassword("password123");

        // When
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/auth/login",
                request,
                Map.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat((Boolean) response.getBody().get("success")).isTrue();

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
        assertThat(data.get("accessToken")).isNotNull();

        @SuppressWarnings("unchecked")
        Map<String, Object> profile = (Map<String, Object>) data.get("profile");
        assertThat(profile.get("email")).isEqualTo("integration@example.com");
    }

    @Test
    @DisplayName("회원가입 후 로그인 통합 테스트")
    void testRegisterAndLogin() {
        // Given - 회원가입
        RegistrationRequest registerRequest = new RegistrationRequest();
        registerRequest.setEmail("newuser@example.com");
        registerRequest.setPassword("newpassword123");
        registerRequest.setNickname("newuser");
        registerRequest.setGender("F");
        registerRequest.setAge(30);

        ResponseEntity<Map> registerResponse = restTemplate.postForEntity(
                "/api/users/register",
                registerRequest,
                Map.class
        );

        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // When - 로그인
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("newuser@example.com");
        loginRequest.setPassword("newpassword123");

        ResponseEntity<Map> loginResponse = restTemplate.postForEntity(
                "/api/auth/login",
                loginRequest,
                Map.class
        );

        // Then
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Boolean) loginResponse.getBody().get("success")).isTrue();
    }
}
