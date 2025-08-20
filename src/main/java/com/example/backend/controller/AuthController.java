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

    @Value("${kakao.client-secret}")
    private String kakaoClientSecret;

    @Value("${kakao.redirect.uri}")
    private String kakaoRedirectUri;

    @GetMapping("/login/kakao")
    public ResponseEntity<Map<String, Object>> kakaoLogin(@RequestParam("code") String code) {
        Map<String, Object> result = new HashMap<>();
        try {
            System.out.println("[START] 카카오 로그인 요청 (GET) 받음");
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

            System.out.println("[Token Request] URL: " + tokenUrl);
            System.out.println("[Token Request] Headers: Content-Type=" + MediaType.APPLICATION_FORM_URLENCODED);
            System.out.println("[Token Request] Params: " + params);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> tokenRequest =
                    new HttpEntity<>(params, headers);

            ResponseEntity<Map> tokenResponse = restTemplate.exchange(
                    tokenUrl, HttpMethod.POST, tokenRequest, Map.class);

            System.out.println("[Token Response] HTTP Status: " + tokenResponse.getStatusCode());
            System.out.println("[Token Response] Body: " + tokenResponse.getBody());

            if (!tokenResponse.getStatusCode().is2xxSuccessful()) {
                result.put("success", false);
                result.put("message", "카카오 토큰 발급 실패");
                result.put("status", tokenResponse.getStatusCode().value());
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(result);
            }

            String accessToken = (String) tokenResponse.getBody().get("access_token");
            System.out.println("Access Token: " + accessToken);

            // 2. 사용자 정보 조회
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.setBearerAuth(accessToken);
            System.out.println("[User Info Request] Authorization: Bearer " + accessToken);

            HttpEntity<String> userRequest = new HttpEntity<>(userHeaders);

            ResponseEntity<Map> userInfoResponse = restTemplate.exchange(
                    "https://kapi.kakao.com/v2/user/me",
                    HttpMethod.GET,
                    userRequest,
                    Map.class);

            System.out.println("[User Info Response] HTTP Status: " + userInfoResponse.getStatusCode());
            System.out.println("[User Info Response] Body: " + userInfoResponse.getBody());

            if (!userInfoResponse.getStatusCode().is2xxSuccessful()) {
                result.put("success", false);
                result.put("message", "카카오 사용자 정보 조회 실패");
                result.put("status", userInfoResponse.getStatusCode().value());
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(result);
            }

            Map<String, Object> userInfo = userInfoResponse.getBody();
            System.out.println("userInfo: " + userInfo);

            Map<String, Object> kakaoAccount = null;
            Map<String, Object> properties = null;

            if (userInfo != null) {
                kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
                properties = (Map<String, Object>) userInfo.get("properties");
            }

            System.out.println("kakaoAccount: " + kakaoAccount);
            System.out.println("properties: " + properties);

            // JWT payload 구성
            Map<String, Object> payload = new HashMap<>();
            if (userInfo != null && userInfo.get("id") != null) {
                payload.put("kakaoId", userInfo.get("id"));
            }
            if (kakaoAccount != null && kakaoAccount.get("email") != null) {
                payload.put("email", kakaoAccount.get("email"));
            }
            if (properties != null && properties.get("nickname") != null) {
                payload.put("nickname", properties.get("nickname"));
            }

            System.out.println("JWT Payload: " + payload);

            // JWT 토큰 생성 (payload.toString() 문제 가능, 추후 JSON 직렬화 권장)
            String jwtToken = jwtUtil.generateToken(payload.toString());

            System.out.println("JWT 토큰 생성 완료: " + jwtToken);

            result.put("success", true);
            result.put("token", jwtToken);
            result.put("provider", "kakao");

            System.out.println("[END] 카카오 로그인 성공");
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("[ERROR] 카카오 로그인 처리 실패: " + e.getMessage());
            e.printStackTrace();

            result.put("success", false);
            result.put("message", "카카오 로그인 처리 실패");
            result.put("error", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }

}
