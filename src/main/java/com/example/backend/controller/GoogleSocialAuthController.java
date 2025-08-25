package com.example.backend.controller;

import com.example.backend.entity.UserEntity;
import com.example.backend.security.JwtUtil;
import com.example.backend.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 구글 소셜 로그인을 위한 REST API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/social/google")
@RequiredArgsConstructor
public class GoogleSocialAuthController {

    @Value("${google.rest.api.key}")
    private String clientId;

    @Value("${google.redirect.uri}")
    private String redirectUri;

    @Value("${google.rest.api.secret}")
    private String clientSecret;

    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 구글 로그인 시작 - OAuth 인증 URL로 리다이렉트
     */
    @GetMapping("/login")
    public void googleLogin(HttpServletResponse response) throws IOException {
        String oauthUrl = buildGoogleOauthUrl();
        log.info("[GoogleLogin] 구글 OAuth URL로 리다이렉트: {}", oauthUrl);
        response.sendRedirect(oauthUrl);
    }

    /**
     * 구글 로그인 콜백 처리
     */
    @GetMapping("/callback")
    public ResponseEntity<?> googleCallback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String state,
            HttpServletResponse response) {

        try {
            log.info("[GoogleLogin] 구글 로그인 콜백 시작 - code: {}, state: {}", code, state);

            // 1. 액세스 토큰 요청
            String accessToken = requestGoogleAccessToken(code);
            log.info("[GoogleLogin] 구글 액세스 토큰 획득 성공");

            // 2. 사용자 정보 조회
            Map<String, Object> userInfo = requestGoogleUserInfo(accessToken);
            String email = (String) userInfo.get("email");
            String nickname = (String) userInfo.get("name");

            validateGoogleUserInfo(email);
            log.info("[GoogleLogin] 구글 사용자 정보 조회 성공 - email: {}, name: {}", email, nickname);

            // 3. 구글 사용자 찾기 또는 생성
            UserEntity user = userService.findOrCreateGoogleUser(email, nickname);

            // 4. JWT 토큰 생성 및 쿠키 설정
            String jwtToken = jwtUtil.generateToken(email);
            setGoogleJwtCookie(response, jwtToken);

            // 5. 프론트엔드로 리다이렉트 (성공 페이지)
            String redirectUrl = "http://localhost:3000/auth/success?provider=google";
            response.sendRedirect(redirectUrl);

            log.info("[GoogleLogin] 구글 로그인 성공 - 사용자: {}", email);
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("[GoogleLogin] 구글 로그인 실패: {}", e.getMessage(), e);
            return buildGoogleErrorResponse(e);
        }
    }

    // === Private Helper Methods ===

    private String buildGoogleOauthUrl() {
        return "https://accounts.google.com/o/oauth2/v2/auth?"
                + "client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&response_type=code"
                + "&scope=email profile openid"
                + "&access_type=offline"
                + "&prompt=consent"
                + "&state=google";
    }

    private String requestGoogleAccessToken(String code) {
        String tokenRequestUrl = "https://oauth2.googleapis.com/token";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    tokenRequestUrl, HttpMethod.POST, entity, Map.class);

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> tokenResponse = responseEntity.getBody();
                String accessToken = (String) tokenResponse.get("access_token");

                if (accessToken == null || accessToken.isEmpty()) {
                    throw new RuntimeException("구글 액세스 토큰을 받을 수 없습니다.");
                }
                return accessToken;
            } else {
                throw new RuntimeException("구글 토큰 요청 실패: " + responseEntity.getStatusCode());
            }

        } catch (Exception e) {
            log.error("구글 액세스 토큰 요청 실패: {}", e.getMessage());
            throw new RuntimeException("구글 액세스 토큰 요청 실패", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> requestGoogleUserInfo(String accessToken) {
        String userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> userInfoResponse = restTemplate.exchange(
                    userInfoUrl, HttpMethod.GET, entity, Map.class);

            if (userInfoResponse.getStatusCode().is2xxSuccessful() && userInfoResponse.getBody() != null) {
                return userInfoResponse.getBody();
            } else {
                throw new RuntimeException("구글 사용자 정보 조회 실패: " + userInfoResponse.getStatusCode());
            }

        } catch (Exception e) {
            log.error("구글 사용자 정보 조회 실패: {}", e.getMessage());
            throw new RuntimeException("구글 사용자 정보 조회 실패", e);
        }
    }

    private void validateGoogleUserInfo(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("구글 계정에서 이메일 정보를 찾을 수 없습니다.");
        }
    }

    private void setGoogleJwtCookie(HttpServletResponse response, String token) {
        Cookie jwtCookie = new Cookie("jwt", token);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(24 * 60 * 60); // 1일
        jwtCookie.setSecure(false); // 로컬 개발환경용

        response.addCookie(jwtCookie);
        log.info("[GoogleLogin] JWT 쿠키 설정 완료");
    }

    private ResponseEntity<Map<String, Object>> buildGoogleErrorResponse(Exception e) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", "구글 로그인 처리 실패");
        errorResponse.put("provider", "GOOGLE");
        errorResponse.put("error", e.getMessage());
        errorResponse.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
