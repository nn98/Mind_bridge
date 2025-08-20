package com.example.backend.controller;

import com.example.backend.dto.UserDto;
import com.example.backend.entity.User;
import com.example.backend.security.JwtUtil;
import com.example.backend.service.KakaoOAuthService;
import com.example.backend.service.UserService;
import lombok.RequiredArgsConstructor;
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

@RestController
@RequestMapping("/api/auth/social")
@RequiredArgsConstructor
public class SocialAuthController {

    private final KakaoOAuthService kakaoOAuthService;
    private final JwtUtil jwtUtil;
    private final UserService userService;  // 사용자 가입/조회 서비스 추가

    @GetMapping("/kakao")
    public ResponseEntity<?> kakaoLogin(@RequestParam("code") String code) {
        System.out.println("[KakaoLogin] 요청 진입");
        System.out.println("[KakaoLogin] 인가 코드 (code): " + code);

        try {
            String accessToken = kakaoOAuthService.requestAccessToken(code);
            System.out.println("[KakaoLogin] 카카오 액세스 토큰: " + accessToken);

            Map<String, Object> userInfo = kakaoOAuthService.requestUserInfo(accessToken);
            System.out.println("[KakaoLogin] 사용자 정보 (userInfo): " + userInfo);

            Map<String, Object> payload = kakaoOAuthService.extractJwtPayload(userInfo);
            System.out.println("[KakaoLogin] JWT 페이로드 (payload): " + payload);

            String email = (String)payload.get("email");
            String nickname = (String)payload.get("nickname");

            if (email == null || email.isEmpty()) {
                throw new RuntimeException("이메일 정보가 카카오 계정에 존재하지 않습니다.");
            }

            // 1. DB에 해당 이메일 사용자 존재 여부 확인
            User user = userService.findByEmail(email).orElseGet(() -> {
                // DB에 없으면 자동 회원가입
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setNickname(nickname != null ? nickname : "kakaoUser_" + System.currentTimeMillis());
                newUser.setRole("USER");
                newUser.setPassword("");  // 소셜 로그인 유저는 패스워드 빈 문자열 또는 랜덤값
                return userService.save(newUser);
            });
            System.out.println("[KakaoLogin] 최종 사용자: " + user.getEmail() + ", 닉네임: " + user.getNickname());

            // 2. 이메일 클레임을 사용해 JWT 토큰 생성 (payload.toString() 대신)
            String token = jwtUtil.generateToken(email);
            System.out.println("[KakaoLogin] JWT 토큰 생성: " + token);

            // 3. JWT 토큰을 HttpOnly 쿠키로 설정
            ResponseCookie cookie = ResponseCookie.from("jwt", token)
                    .httpOnly(true)
                    .secure(true) // HTTPS 환경 권장, 개발 시 false로 변경 가능
                    .path("/")
                    .maxAge(24 * 60 * 60) // 1일
                    .sameSite("Strict")
                    .build();
            System.out.println("[KakaoLogin] Set-Cookie 헤더 생성: " + cookie.toString());

            // 4. 사용자 정보는 필요에 따라 JSON 응답에 포함 가능
            UserDto userDto = new UserDto(user);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Map.of(
                            "success", true,
                            "user", userDto
                    ));

        } catch (Exception e) {
            System.err.println("[KakaoLogin] 예외 발생: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "카카오 로그인 처리 실패");
            errorResponse.put("error", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

}
