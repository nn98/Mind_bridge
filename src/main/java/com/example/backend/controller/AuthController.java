package com.example.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.auth.FindIdRequest;
import com.example.backend.dto.auth.LoginRequest;
import com.example.backend.dto.auth.ResetPasswordRequest;
import com.example.backend.dto.common.ApiResponse;
import com.example.backend.service.AuthService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 인증 관련 REST API 컨트롤러
 * HTTP 요청/응답 처리만 담당하며, 모든 비즈니스 로직은 AuthService에 위임
 */
@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    /**
     * 사용자 로그인 - 인증부터 쿠키 설정까지 모든 처리를 AuthService에 위임
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletResponse response) {

        authService.loginAndSetCookie(request, response);
        return ResponseEntity.ok(ApiResponse.empty());
    }

    /**
     * 로그아웃 - 쿠키 삭제를 AuthService에 위임
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(ApiResponse.success("로그아웃되었습니다."));
    }

    /**
     * 아이디 찾기 - 실패 시 예외 전파로 Advice에서 처리
     */
    @PostMapping("/find-id")
    public ResponseEntity<ApiResponse<Map<String, String>>> findUserId(
        @Valid @RequestBody FindIdRequest request) {

        String maskedEmail = authService.findAndMaskUserEmail(request);
        return ResponseEntity.ok(ApiResponse.success(Map.of("email", maskedEmail)));
    }

    /**
     * 비밀번호 재설정 - 실패 시 예외 전파로 Advice에서 처리
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetPassword(
        @Valid @RequestBody ResetPasswordRequest request) {

        String tempPassword = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(
            Map.of("tempPassword", tempPassword),
            "임시 비밀번호가 이메일로 발송되었습니다."
        ));
    }
}
