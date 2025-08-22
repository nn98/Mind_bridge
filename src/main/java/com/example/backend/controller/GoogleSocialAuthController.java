package com.example.backend.controller;

import com.example.backend.dto.response.UserDto;
import com.example.backend.entity.UserEntity;
import com.example.backend.security.JwtUtil;
import com.example.backend.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
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
import java.util.Optional;

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

    // 1. 구글 로그인 시작 - 리다이렉트용 OAuth 인증 URL 생성 및 즉시 리다이렉트
    @GetMapping("/login")
    public void googleLogin(HttpServletResponse response) throws IOException {
        String oauthUrl = buildGoogleOauthUrl();
        response.sendRedirect(oauthUrl);
    }

    // 2. 구글 로그인 콜백 처리 - 토큰 교환부터 JWT 생성 및 리다이렉트 응답까지
    @GetMapping("/callback")
    public ResponseEntity<?> googleCallback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String state) {

        try {
            // 2.1 토큰 요청 및 액세스 토큰 획득
            String accessToken = requestAccessToken(code);

            // 2.2 구글 사용자 정보 조회
            Map<String, Object> userInfo = requestGoogleUserInfo(accessToken);

            // 2.3 사용자 이메일, 닉네임 추출 및 검증
            String email = (String) userInfo.get("email");
            String nickname = (String) userInfo.get("name");
            validateUserInfo(email);

            // 2.4 DB 사용자 확인 및 자동 회원가입 처리
            UserEntity user = findOrCreateUser(email, nickname);

            // 2.5 JWT 토큰 생성
            String token = jwtUtil.generateToken(email);

            // 2.6 JWT 쿠키 생성
            ResponseCookie cookie = createJwtCookie(token);

            // 2.7 사용자 정보 DTO 변환
            UserDto userDto = convertToUserDto(user);

            // 2.8 리다이렉트 헤더 생성 (쿠키 포함)
            HttpHeaders headers = createRedirectHeaders(cookie, "http://localhost:3000/auth/loading");

            // 2.9 성공 리다이렉트 응답
            return new ResponseEntity<>(headers, HttpStatus.FOUND);

        } catch (Exception e) {
            // 예외 처리 및 실패 응답 반환
            return buildErrorResponse(e);
        }
    }

    // 메서드: 구글 OAuth 인증 URL 생성
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

    // 메서드: 액세스 토큰 요청 및 리턴
    private String requestAccessToken(String code) {
        String tokenRequestUrl = "https://oauth2.googleapis.com/token";
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        Map<String, Object> tokenResponse = restTemplate.postForObject(tokenRequestUrl, params, Map.class);
        if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
            throw new RuntimeException("Failed to obtain access token from Google");
        }
        return (String) tokenResponse.get("access_token");
    }

    // 메서드: 구글 사용자 정보 API 호출
    private Map<String, Object> requestGoogleUserInfo(String accessToken) {
        String userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> userInfoResponse = restTemplate.exchange(userInfoUrl, HttpMethod.GET, entity, Map.class);
        if (!userInfoResponse.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to get user info from Google");
        }
        return userInfoResponse.getBody();
    }

    // 메서드: 사용자 이메일 검증
    private void validateUserInfo(String email) {
        if (email == null || email.isEmpty()) {
            throw new RuntimeException("이메일 정보가 구글 계정에 존재하지 않습니다.");
        }
    }

    // 메서드: 이메일로 DB 사용자 찾거나 자동 회원가입
    private UserEntity findOrCreateUser(String email, String nickname) {
        Optional<UserEntity> userOpt = userService.findByEmail(email);
        return userOpt.orElseGet(() -> {
            UserEntity newUser = new UserEntity();
            newUser.setEmail(email);
            newUser.setFullName(nickname != null ? nickname : "googleUser_" + System.currentTimeMillis());
            newUser.setRole("USER");
            newUser.setPassword(""); // 소셜 로그인 유저는 패스워드 빈 문자열 또는 랜덤값
            return userService.save(newUser);
        });
    }

    // 메서드: JWT쿠키 생성
    private ResponseCookie createJwtCookie(String token) {
        return ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(true) // HTTPS 환경에서는 true, 로컬개발: false 설정 가능
                .path("/")
                .maxAge(24 * 60 * 60) // 1일
                .sameSite("Strict")
                .build();
    }

    // 메서드: UserEntity → UserDto 변환
    private UserDto convertToUserDto(UserEntity user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setEmail(user.getEmail());
        userDto.setFullName(user.getFullName());
        userDto.setNickname(user.getNickname());
        userDto.setPhoneNumber(user.getPhoneNumber());
        userDto.setGender(user.getGender());
        userDto.setAge(user.getAge());
        userDto.setRole(user.getRole());
        userDto.setMentalState(user.getMentalState());
        return userDto;
    }

    // 메서드: 리다이렉트 응답용 헤더 생성 (쿠키 및 Location 포함)
    private HttpHeaders createRedirectHeaders(ResponseCookie cookie, String redirectUrl) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
        headers.add(HttpHeaders.LOCATION, redirectUrl);
        return headers;
    }

    // 메서드: 에러 로그 후 실패 JSON 응답 생성
    private ResponseEntity<Map<String, Object>> buildErrorResponse(Exception e) {
        System.err.println("[GoogleLogin] 예외 발생: " + e.getMessage());
        e.printStackTrace();

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", "구글 로그인 처리 실패");
        errorResponse.put("error", e.getMessage());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
