package com.example.backend.controller;

import com.example.backend.dto.LoginResponse;
import com.example.backend.security.JwtUtil;
import com.example.backend.service.KakaoOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/social")
@RequiredArgsConstructor
public class SocialAuthController {

    private final KakaoOAuthService kakaoOAuthService;
    private final JwtUtil jwtUtil;

    @GetMapping("/kakao")
    public ResponseEntity<?> kakaoLogin(@RequestParam("code") String code) {
        try {
            String accessToken = kakaoOAuthService.requestAccessToken(code);
            Map<String, Object> userInfo = kakaoOAuthService.requestUserInfo(accessToken);
            Map<String, Object> payload = kakaoOAuthService.extractJwtPayload(userInfo);

            // JWT 토큰 생성 시 Map을 JSON 직렬화 후 전달하는 것을 권장
            String token = jwtUtil.generateToken(payload.toString());

            LoginResponse response = new LoginResponse(token);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "카카오 로그인 처리 실패");
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
