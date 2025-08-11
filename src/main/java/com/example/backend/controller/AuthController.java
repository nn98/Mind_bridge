package com.example.backend.controller;

import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.LoginResponse;
import com.example.backend.security.JwtUtil;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {

        try {
            // 이메일, 비밀번호 기반 인증 시도
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword())
            );

            // 인증 성공 시 JWT 토큰 생성
            String token = jwtUtil.generateToken(loginRequest.getEmail());

            // 토큰을 포함한 응답 리턴
            return ResponseEntity.ok(new LoginResponse(token));

        } catch (AuthenticationException ex) {
            // 인증 실패 시 401 응답
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${kakao.rest.api.key}")
    private String kakaoClientId;

    @Value("${kakao.client-secret:}")
    private String kakaoClientSecret;

    @Value("${kakao.redirect.uri}")
    private String kakaoRedirectUri;

    @GetMapping("/login/kakao")
    public ResponseEntity<Map<String, Object>> kakaoLogin(@RequestParam("code") String code) {
        Map<String, Object> result = new HashMap<>();
        try {
            System.out.println("카카오 로그인 요청 (GET) 받음");
            System.out.println("인가 코드(code): " + code);

            // 1. 카카오 토큰 요청
            String tokenUrl = "https://kauth.kakao.com/oauth/token";
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("grant_type", "authorization_code");
            params.add("client_id", kakaoClientId);
            params.add("redirect_uri", kakaoRedirectUri);
            params.add("code", code);
            if (!kakaoClientSecret.isBlank()) {
                params.add("client_secret", kakaoClientSecret);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> tokenRequest =
                    new HttpEntity<>(params, headers);

            ResponseEntity<Map> tokenResponse = restTemplate.exchange(
                    tokenUrl, HttpMethod.POST, tokenRequest, Map.class);

            if (!tokenResponse.getStatusCode().is2xxSuccessful()) {
                result.put("success", false);
                result.put("message", "카카오 토큰 발급 실패");
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(result);
            }

            String accessToken = (String) tokenResponse.getBody().get("access_token");

            // 2. 사용자 정보 조회
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);
            HttpEntity<String> userRequest = new HttpEntity<>(userHeaders);

            ResponseEntity<Map> userInfoResponse = restTemplate.exchange(
                    "https://kapi.kakao.com/v2/user/me",
                    HttpMethod.GET,
                    userRequest,
                    Map.class);

            if (!userInfoResponse.getStatusCode().is2xxSuccessful()) {
                result.put("success", false);
                result.put("message", "카카오 사용자 정보 조회 실패");
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(result);
            }

            Map<String, Object> userInfo = userInfoResponse.getBody();
            Map<String, Object> kakaoAccount = userInfo != null ? (Map<String, Object>) userInfo.get("kakao_account") : null;
            Map<String, Object> properties = userInfo != null ? (Map<String, Object>) userInfo.get("properties") : null;

            // JWT payload 구성: 이메일 없으면 ID, 닉네임도 넣기
            Map<String, Object> payload = new HashMap<>();
            // 카카오 user ID
            if (userInfo != null && userInfo.get("id") != null) {
                payload.put("kakaoId", userInfo.get("id"));
            }
            // 이메일 (없으면 null)
            if (kakaoAccount != null && kakaoAccount.get("email") != null) {
                payload.put("email", kakaoAccount.get("email"));
            }
            // 닉네임 등 프로필 정보 포함 가능
            if (properties != null && properties.get("nickname") != null) {
                payload.put("nickname", properties.get("nickname"));
            }

            // 3. JWT 생성 (커스텀 payload로)
            String jwtToken = jwtUtil.generateToken(payload.toString());
            System.out.println("JWT 토큰 생성 완료: " + jwtToken);

            result.put("success", true);
            result.put("token", jwtToken);
            result.put("provider", "kakao");
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "카카오 로그인 처리 실패");
            result.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
}
