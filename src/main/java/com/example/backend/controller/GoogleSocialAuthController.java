package com.example.backend.controller;

import com.example.backend.dto.response.UserDto;
import com.example.backend.entity.UserEntity;
import com.example.backend.security.JwtUtil;
import com.example.backend.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
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

    // 1. 구글 로그인 시작 - 구글 OAuth 인증 URL 생성 및 리다이렉트용 (주로 클라이언트에서 구현하지만 백엔드 제공 시)
    @GetMapping("/login")
    public void googleLogin(HttpServletResponse response) throws IOException {
        String oauthUrl = "https://accounts.google.com/o/oauth2/v2/auth?"
                + "client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&response_type=code"
                + "&scope=email profile openid"
                + "&access_type=offline"
                + "&prompt=consent"
                + "&state=google";

        response.sendRedirect(oauthUrl);
    }

    // 2. 구글 로그인 콜백 처리
    @GetMapping("/callback")
    public ResponseEntity<?> googleCallback(@RequestParam("code") String code, @RequestParam(value="state", required=false) String state) {
        System.out.println("[GoogleLogin] 콜백 진입, code: " + code + ", state: " + state);

        try {
            // 토큰 요청 URL
            String tokenRequestUrl = "https://oauth2.googleapis.com/token";

            // 토큰 요청 파라미터 세팅
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("code", code);
            params.add("client_id", clientId);
            // client_secret 사용하지 않을 수도 있지만, 보통 필요하니 환경변수로 관리 권장
            params.add("client_secret", clientSecret); // 필요하면 추가
            params.add("redirect_uri", redirectUri);
            params.add("grant_type", "authorization_code");

            // 액세스 토큰 요청
            Map<String, Object> tokenResponse = restTemplate.postForObject(tokenRequestUrl, params, Map.class);

            if(tokenResponse == null || !tokenResponse.containsKey("access_token")) {
                throw new RuntimeException("Failed to obtain access token from Google");
            }

            String accessToken = (String) tokenResponse.get("access_token");
            System.out.println("[GoogleLogin] 액세스 토큰: " + accessToken);

            // Google 유저 정보 요청
            String userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

            // Bearer 토큰 헤더 포함 요청
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.add(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);

            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            ResponseEntity<Map> userInfoResponse = restTemplate.exchange(userInfoUrl, org.springframework.http.HttpMethod.GET, entity, Map.class);

            Map<String, Object> userInfo = userInfoResponse.getBody();
            System.out.println("[GoogleLogin] 사용자 정보: " + userInfo);

            String email = (String) userInfo.get("email");
            String nickname = (String) userInfo.get("name");

            if (email == null || email.isEmpty()) {
                throw new RuntimeException("이메일 정보가 구글 계정에 존재하지 않습니다.");
            }

            // DB에 해당 이메일 사용자 존재 여부 확인 및 자동 회원가입
            Optional<UserEntity> userOpt = userService.findByEmail(email);
            UserEntity user = userOpt.orElseGet(() -> {
                UserEntity newUser = new UserEntity();
                newUser.setEmail(email);
                newUser.setFullName(nickname != null ? nickname : "googleUser_" + System.currentTimeMillis());
                newUser.setRole("USER");
                newUser.setPassword(""); // 소셜 로그인 유저는 패스워드 빈 문자열 또는 랜덤값
                return userService.save(newUser);
            });

            // JWT 생성
            String token = jwtUtil.generateToken(email);
            System.out.println("[GoogleLogin] JWT 토큰 생성: " + token);

            // JWT 쿠키 세팅
            ResponseCookie cookie = ResponseCookie.from("jwt", token)
                    .httpOnly(true)
                    .secure(true) // HTTPS 환경에서는 true, 개발 중엔 false 가능
                    .path("/")
                    .maxAge(24 * 60 * 60) // 1일
                    .sameSite("Strict")
                    .build();

            // 사용자 정보 DTO 생성
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

            // 응답: 토큰 쿠키 설정과 JSON body로 성공 응답 전달
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Map.of(
                            "success", true,
                            "user", userDto,
                            "type", "Google"
                    ));

            // 프론트 리다이렉트용 JSON 응답 예시 (향후 필요시 활성화)
            // return ResponseEntity.ok().body(Map.of("redirectUrl", "http://localhost:3000/"));

        } catch (Exception e) {
            System.err.println("[GoogleLogin] 예외 발생: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "구글 로그인 처리 실패");
            errorResponse.put("error", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
