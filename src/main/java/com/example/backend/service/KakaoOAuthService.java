package com.example.backend.service;

import com.example.backend.entity.User;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class KakaoOAuthService {

    private final RestTemplate restTemplate;
    private final UserService userService;  // UserService 주입 추가

    @Value("${kakao.rest.api.key}")
    private String kakaoClientId;

    @Value("${kakao.client-secret:}")
    private String kakaoClientSecret;

    @Value("${kakao.redirect.uri}")
    private String kakaoRedirectUri;

    public String requestAccessToken(String code) {
        String tokenUrl = "https://kauth.kakao.com/oauth/token";

        System.out.println("[Kakao access] URL: " + tokenUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", kakaoClientId);
        params.add("redirect_uri", kakaoRedirectUri);
        params.add("code", code);
        if (!kakaoClientSecret.isBlank()) {
            params.add("client_secret", kakaoClientSecret);
        }

        System.out.println("[Token Request] URL: " + tokenUrl);
        System.out.println("[Token Request] Params: " + params);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<Map> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, request, Map.class);

        System.out.println("[Token Response] Status: " + response.getStatusCode());
        System.out.println("[Token Response] Body: " + response.getBody());

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("카카오 토큰 발급 실패");
        }
        Map<String, Object> body = response.getBody();
        if (body == null || !body.containsKey("access_token")) {
            throw new RuntimeException("토큰 응답에서 access_token 누락");
        }
        return (String) body.get("access_token");
    }

    public Map<String, Object> requestUserInfo(String accessToken) {
        String userInfoUrl = "https://kapi.kakao.com/v2/user/me";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        System.out.println("[UserInfo Request] URL: " + userInfoUrl);
        System.out.println("[UserInfo Request] Authorization: Bearer " + accessToken);

        HttpEntity<String> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(userInfoUrl, HttpMethod.GET, request, Map.class);

        System.out.println("[UserInfo Response] Status: " + response.getStatusCode());
        System.out.println("[UserInfo Response] Body: " + response.getBody());

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("카카오 사용자 정보 조회 실패");
        }
        return response.getBody();
    }

    public Map<String, Object> extractJwtPayload(Map<String, Object> userInfo) {
        Map<String, Object> payload = new HashMap<>();
        if (userInfo.get("id") != null) {
            payload.put("kakaoId", userInfo.get("id"));
        }
        Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
        if (kakaoAccount != null && kakaoAccount.get("email") != null) {
            payload.put("email", kakaoAccount.get("email"));
        }
        Map<String, Object> properties = (Map<String, Object>) userInfo.get("properties");
        if (properties != null && properties.get("nickname") != null) {
            payload.put("nickname", properties.get("nickname"));
        }

        System.out.println("[Extract JWT Payload] Payload: " + payload);

        return payload;
    }

    // 자동 회원가입 처리 메소드 추가
    public User registerKakaoUserIfNotExist(Map<String, Object> userInfo) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
        Map<String, Object> properties = (Map<String, Object>) userInfo.get("properties");

        String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
        String nickname = properties != null ? (String) properties.get("nickname") : null;

        System.out.println("[Auto Registration] 확인 email=" + email + ", nickname=" + nickname);

        if (email == null) {
            throw new RuntimeException("카카오 계정에 이메일이 존재하지 않습니다.");
        }

        Optional<User> existingUser = userService.findByEmail(email);

        if (existingUser.isPresent()) {
            System.out.println("[Auto Registration] 기존 사용자 존재, 등록하지 않음");
            return existingUser.get();
        } else {
            System.out.println("[Auto Registration] 신규 사용자 등록 시작");
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setNickname(nickname != null ? nickname : "kakaoUser_" + System.currentTimeMillis());
            newUser.setRole("USER");

            // 소셜 로그인 유저는 패스워드는 null 혹은 빈 문자열로 처리
            newUser.setPassword("");

            // 필요한 추가 필드 (fullName, gender, phoneNumber 등) api에서 없으면 기본 값으로 처리 가능

            User savedUser = userService.save(newUser);
            System.out.println("[Auto Registration] 신규 사용자 등록 완료: " + savedUser.getEmail());
            return savedUser;
        }
    }
}
