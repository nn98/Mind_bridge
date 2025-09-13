package com.example.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.auth.FindIdRequest;
import com.example.backend.dto.auth.LoginRequest;
import com.example.backend.dto.auth.ResetPasswordRequest;
import com.example.backend.dto.common.ApiResponse;
import com.example.backend.security.JwtUtil;
import com.example.backend.service.AuthService;
import com.example.backend.service.DailyMetricsService;

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
    private final DailyMetricsService dailyMetricsService; // 인터페이스

    /**
     * 사용자 로그인 - HTTP 처리만 담당 (실패는 예외 전파 → Advice)
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        jwtUtil.setJwtCookie(response, jwtUtil.generateToken(request.getEmail()));
        authService.updateLastLogin(request);

        //일일 접속자 수카운트 증가
        dailyMetricsService.increaseUserCount();

        return ResponseEntity.ok(ApiResponse.empty());
    }

    /**
     * 로그아웃 - 쿠키 삭제만 담당
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletResponse response) {
        jwtUtil.clearJwtCookie(response);
        return ResponseEntity.ok(ApiResponse.success("로그아웃되었습니다."));
    }

    /**
     * 아이디 찾기 (실패는 404/400 등 Advice 처리)
     */
    @PostMapping("/find-id")
    public ResponseEntity<ApiResponse<Map<String, String>>> findUserId(@Valid @RequestBody FindIdRequest request) {
        String maskedEmail = authService.findAndMaskUserEmail(request);
        if (maskedEmail == null) {
            // NotFoundException을 던져도 되지만, 기존 동작을 최대한 유지
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("일치하는 회원 정보를 찾을 수 없습니다.", null));
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("email", maskedEmail)));
    }

    /**
     * 비밀번호 재설정 (실패는 Advice 처리)
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String tempPassword = authService.resetPassword(request);
        if (tempPassword == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("해당 이메일로 등록된 계정이 없습니다.", null));
        }
        Map<String, String> responseData = new HashMap<>();
        responseData.put("tempPassword", tempPassword);
        return ResponseEntity.ok(ApiResponse.success(responseData, "임시 비밀번호가 이메일로 발송되었습니다."));
    }
}
