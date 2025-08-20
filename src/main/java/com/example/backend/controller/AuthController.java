package com.example.backend.controller;

import com.example.backend.dto.LoginRequest;
import com.example.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        System.out.println("[Login] 로그인 요청 시작");
        System.out.println("이메일: " + loginRequest.getEmail());
        try {
            // 이메일, 비밀번호 기반 인증 시도
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword())
            );
            System.out.println("[Login] 인증 성공: " + authentication.isAuthenticated());

            // 인증 성공 시 JWT 토큰 생성
            String token = jwtUtil.generateToken(loginRequest.getEmail());
            System.out.println("[Login] JWT 토큰 생성 완료: " + token);

            ResponseCookie cookie = ResponseCookie.from("jwt", token)
                    .httpOnly(true)
                    .secure(true) // HTTPS 환경에서만 전송
                    .path("/")
                    .maxAge(24 * 60 * 60) // 만료 시간 설정 (1일)
                    .sameSite("Strict") // CSRF 방지 정책
                    .build();
            System.out.println("[Login] Set-Cookie 헤더 생성: " + cookie.toString());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Map.of("success", true));

        } catch (AuthenticationException ex) {
            System.err.println("[Login] 인증 실패: " + ex.getMessage());
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

}
