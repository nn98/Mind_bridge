package com.example.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.api.dto.auth.FindIdRequest;
import com.example.backend.api.dto.auth.LoginRequest;
import com.example.backend.api.dto.auth.LoginResponse;
import com.example.backend.api.dto.auth.ResetPasswordRequest;
import com.example.backend.api.dto.common.ApiResponse;
import com.example.backend.security.JwtUtil;
import com.example.backend.service.AuthService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 인증 관련 REST API 컨트롤러 로그인, 아이디/비밀번호 찾기 등의 인증 기능 제공
 */
@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    /**
     * 사용자 로그인 - HTTP 처리만 담당
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        try {
            // AuthService에서 이미 토큰까지 생성해서 줌
            LoginResponse loginResponse = authService.login(request);

            // 쿠키 설정만 Controller에서
            jwtUtil.setJwtCookie(response, loginResponse.getAccessToken());

            authService.updateLastLogin(request);

            return ResponseEntity.ok(ApiResponse.success(loginResponse));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("로그인 실패", e.getMessage()));
        }
    }

    /**
     * 로그아웃 - 쿠키 삭제만 담당
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletResponse response) {
        System.out.println("Logout Called");
        jwtUtil.clearJwtCookie(response);
        return ResponseEntity.ok(ApiResponse.success("로그아웃되었습니다."));
    }

    /**
     * 아이디 찾기
     */
    @PostMapping("/find-id")
    public ResponseEntity<ApiResponse<Map<String, String>>> findUserId(@Valid @RequestBody FindIdRequest request) {
        try {
            String maskedEmail = authService.findAndMaskUserEmail(request);
            if (maskedEmail == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("일치하는 회원 정보를 찾을 수 없습니다.", null));
            }

            return ResponseEntity.ok(ApiResponse.success(Map.of("email", maskedEmail)));

        } catch (Exception e) {
            log.error("아이디 찾기 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("아이디 찾기에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 비밀번호 재설정
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            String tempPassword = authService.resetPassword(request);

            if (tempPassword == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("해당 이메일로 등록된 계정이 없습니다.", null));
            }

            Map<String, String> responseData = new HashMap<>();
            responseData.put("tempPassword", tempPassword);

            return ResponseEntity.ok(
                    ApiResponse.success(responseData, "임시 비밀번호가 이메일로 발송되었습니다.")
            );

        } catch (Exception e) {
            log.error("비밀번호 재설정 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("비밀번호 재설정에 실패했습니다.", e.getMessage()));
        }
    }
}
