package com.example.backend.controller;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.response.UserDto;
import com.example.backend.dto.request.UserRequest;
import com.example.backend.security.JwtUtil;
import com.example.backend.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    /**
     * ✅ 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserRequest.Login loginRequest) {
        try {
            System.out.println(loginRequest.getEmail());
            System.out.println(loginRequest.getPassword());
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword())
            );

            String token = jwtUtil.generateToken(loginRequest.getEmail());
            System.out.println(token);

            ResponseCookie cookie = ResponseCookie.from("jwt", token)
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .maxAge(24 * 60 * 60)
                    .sameSite("Strict")
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Map.of("success", true));

        } catch (AuthenticationException ex) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

    /**
     * ✅ 로그아웃
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0) // 즉시 만료
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("success", true, "message", "로그아웃 완료"));
    }

    /**
     * ✅ 토큰 갱신
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        String oldToken = jwtUtil.resolveToken(request);

        if (oldToken == null || !jwtUtil.validateToken(oldToken)) {
            return ResponseEntity.status(401).body("유효하지 않은 토큰입니다.");
        }

        String email = jwtUtil.getEmailFromToken(oldToken);
        String newToken = jwtUtil.generateToken(email);

        ResponseCookie cookie = ResponseCookie.from("jwt", newToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(24 * 60 * 60)
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("success", true));
    }

    /**
     * ✅ 현재 로그인된 사용자 확인
     */
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(null); // UserDto 타입으로 명시
        }

        String email = authentication.getName();
        return userService.findByEmail(email)
                .map(user -> {
                    UserDto dto = new UserDto();
                    dto.setId(user.getId());
                    dto.setEmail(user.getEmail());
                    dto.setFullName(user.getFullName());
                    dto.setNickname(user.getNickname());
                    dto.setPhoneNumber(user.getPhoneNumber());
                    dto.setGender(user.getGender());
                    dto.setAge(user.getAge());
                    dto.setRole(user.getRole());
                    dto.setMentalState(user.getMentalState());
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.status(404).body(null));
    }

}
