// src/test/java/com/example/backend/security/JwtUtilTest.java
package com.example.backend.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.*;

import com.example.backend.infrastructure.security.JwtUtil;

@ExtendWith(MockitoExtension.class)
public class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        String secretKey = "dGVzdC1zZWNyZXQta2V5LXRoYXQtaXMtbG9uZy1lbm91Z2gtZm9yLWhtYWMtc2hhMjU2"; // Base64 encoded test key
        long expirationMillis = 3600000; // 1 hour

        jwtUtil = new JwtUtil(secretKey, expirationMillis);
        jwtUtil.init(); // @PostConstruct 메서드 수동 호출
    }

    @Test
    @DisplayName("JWT 토큰 생성")
    void testGenerateToken() {
        // Given
        String email = "test@example.com";

        // When
        String token = jwtUtil.generateToken(email);

        // Then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT는 3개 부분으로 구성
    }

    @Test
    @DisplayName("JWT 토큰 검증 - 유효한 토큰")
    void testValidateTokenValid() {
        // Given
        String email = "test@example.com";
        String token = jwtUtil.generateToken(email);

        // When
        boolean isValid = jwtUtil.validateToken(token);

        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("JWT 토큰 검증 - 무효한 토큰")
    void testValidateTokenInvalid() {
        // Given
        String invalidToken = "invalid.token.here";

        // When
        boolean isValid = jwtUtil.validateToken(invalidToken);

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("JWT 토큰에서 이메일 추출")
    void testGetEmailFromToken() {
        // Given
        String email = "test@example.com";
        String token = jwtUtil.generateToken(email);

        // When
        String extractedEmail = jwtUtil.getEmailFromToken(token);

        // Then
        assertThat(extractedEmail).isEqualTo(email);
    }

    @Test
    @DisplayName("HTTP 요청에서 토큰 추출 - Authorization 헤더")
    void testResolveTokenFromAuthorizationHeader() {
        // Given
        String token = "test-jwt-token";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);

        // When
        String resolvedToken = jwtUtil.resolveToken(request);

        // Then
        assertThat(resolvedToken).isEqualTo(token);
    }

    @Test
    @DisplayName("HTTP 요청에서 토큰 추출 - 쿠키")
    void testResolveTokenFromCookie() {
        // Given
        String token = "test-jwt-token";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("jwt", token));

        // When
        String resolvedToken = jwtUtil.resolveToken(request);

        // Then
        assertThat(resolvedToken).isEqualTo(token);
    }
}
