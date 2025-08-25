package com.example.backend.controller;

import com.example.backend.dto.user.Profile;
import com.example.backend.entity.UserEntity;
import com.example.backend.security.JwtUtil;
import com.example.backend.service.KakaoOAuthService;
import com.example.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 카카오 소셜 로그인을 위한 REST API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/social/kakao")
@RequiredArgsConstructor
public class KakaoSocialAuthController {

    private final KakaoOAuthService kakaoOAuthService;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    /**
     * 카카오 로그인 콜백 처리
     * @param code 카카오에서 전달받은 인증 코드
     * @return JWT 토큰과 사용자 정보
     */
    @GetMapping("/callback")
    public ResponseEntity<?> kakaoCallback(@RequestParam("code") String code) {
        log.info("[KakaoLogin] 카카오 로그인 콜백 요청 - code: {}", code);

        try {
            // 1. 카카오 액세스 토큰 요청
            String accessToken = kakaoOAuthService.requestAccessToken(code);
            log.info("[KakaoLogin] 카카오 액세스 토큰 획득 성공");

            // 2. 카카오 사용자 정보 조회
            Map<String, Object> userInfo = kakaoOAuthService.requestUserInfo(accessToken);
            log.info("[KakaoLogin] 사용자 정보 조회 성공");

            // 3. JWT 페이로드 추출
            Map<String, Object> payload = kakaoOAuthService.extractJwtPayload(userInfo);
            String email = (String) payload.get("email");
            String nickname = (String) payload.get("nickname");

            validateKakaoUserInfo(email);

            // 4. 카카오 사용자 찾기 또는 생성
            UserEntity user = userService.findOrCreateKakaoUser(email, nickname);
            log.info("[KakaoLogin] 사용자 처리 완료 - 이메일: {}, 닉네임: {}",
                    user.getEmail(), user.getNickname());

            // 5. JWT 토큰 생성 및 쿠키 설정
            String token = jwtUtil.generateToken(email);
            ResponseCookie cookie = createKakaoJwtCookie(token);

            // 6. 사용자 정보를 Profile DTO로 변환
            Profile profile = convertKakaoUserToProfile(user);

            log.info("[KakaoLogin] 카카오 로그인 성공 - 사용자: {}", email);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Map.of(
                            "success", true,
                            "user", profile,
                            "provider", "KAKAO",
                            "message", "카카오 로그인 성공"
                    ));

        } catch (Exception e) {
            log.error("[KakaoLogin] 카카오 로그인 실패: {}", e.getMessage(), e);
            return buildKakaoErrorResponse(e);
        }
    }

    /**
     * 카카오 로그인 시작 페이지로 리다이렉트
     * @return 카카오 OAuth URL로 리다이렉트
     */
    @GetMapping("/login")
    public ResponseEntity<?> initiateKakaoLogin() {
        try {
            // 카카오 OAuth URL 생성 로직 (KakaoOAuthService에 구현 필요)
            String kakaoAuthUrl = kakaoOAuthService.getAuthorizationUrl();

            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, kakaoAuthUrl)
                    .build();

        } catch (Exception e) {
            log.error("[KakaoLogin] 카카오 로그인 시작 실패: {}", e.getMessage());
            return buildKakaoErrorResponse(e);
        }
    }

    /**
     * 카카오 사용자 정보 유효성 검증
     */
    private void validateKakaoUserInfo(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("카카오 계정에서 이메일 정보를 찾을 수 없습니다.");
        }
    }

    /**
     * 카카오 전용 JWT 쿠키 생성
     */
    private ResponseCookie createKakaoJwtCookie(String token) {
        return ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false) // 로컬 개발환경용
                .path("/")
                .maxAge(24 * 60 * 60) // 1일
                .sameSite("Strict")
                .build();
    }

    /**
     * 카카오 사용자 Entity를 Profile DTO로 변환
     */
    private Profile convertKakaoUserToProfile(UserEntity user) {
        Profile profile = new Profile();
        profile.setId(user.getId());
        profile.setEmail(user.getEmail());
        profile.setFullName(user.getFullName());
        profile.setNickname(user.getNickname());
        profile.setPhoneNumber(user.getPhoneNumber());
        profile.setGender(user.getGender());
        profile.setAge(user.getAge());
        profile.setMentalState(user.getMentalState());
        profile.setChatGoal(user.getChatGoal());
        profile.setCreatedAt(user.getCreatedAt());
        profile.setUpdatedAt(user.getUpdatedAt());
        return profile;
    }

    /**
     * 카카오 로그인 에러 응답 생성
     */
    private ResponseEntity<Map<String, Object>> buildKakaoErrorResponse(Exception e) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", "카카오 로그인 처리 실패");
        errorResponse.put("provider", "KAKAO");
        errorResponse.put("error", e.getMessage());
        errorResponse.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
