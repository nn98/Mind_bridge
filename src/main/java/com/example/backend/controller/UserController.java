package com.example.backend.controller;

import com.example.backend.dto.FindIdRequest;
import com.example.backend.dto.ResetPasswordRequest;
import com.example.backend.dto.UserDto;
import com.example.backend.dto.UserRegisterRequest;
import com.example.backend.entity.User;
import com.example.backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterRequest req) {
        userService.register(req);
        return ResponseEntity.ok(Map.of("message", "회원가입 성공"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        System.out.println("[Login] 로그인 요청 시작");
        try {
            String email = loginRequest.get("email");
            String password = loginRequest.get("password");
            System.out.println("[Login] 이메일: " + email);
            System.out.println("[Login] 패스워드: " + (password != null ? "*****" : "null"));

            // 이메일, 비밀번호 기반 인증 수행
            String token = userService.login(email, password);
            System.out.println("[Login] 인증 성공, JWT 토큰 생성: " + token);

            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("사용자 정보를 찾을 수 없습니다."));
            UserDto userDto = new UserDto(user);
            System.out.println("[Login] 사용자 정보 조회 완료: " + userDto);

            // JWT 토큰을 HttpOnly 쿠키로 설정
            ResponseCookie cookie = ResponseCookie.from("jwt", token)
                    .httpOnly(true)
                    .secure(true) // HTTPS 환경에서만 전송 권장
                    .path("/")
                    .maxAge(24 * 60 * 60) // 1일 만료
                    .sameSite("Strict") // CSRF 방지 정책
                    .build();
            System.out.println("[Login] Set-Cookie 헤더 생성: " + cookie.toString());

            // 토큰은 쿠키에 담아주고, 사용자 정보는 Body로 전달
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(Map.of(
                            "success", true,
                            "user", userDto
                    ));

        } catch (Exception e) {
            System.err.println("[Login] 로그인 처리 실패: " + e.getMessage());
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestBody Map<String, String> emailRequest) {
        String email = emailRequest.get("email");
        boolean isAvailable = userService.isEmailAvailable(email);
        return ResponseEntity.ok(Map.of("isAvailable", isAvailable));
    }
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication, HttpServletRequest request) {
        System.out.println("[GetCurrentUser] 요청 진입");
        System.out.println("Authorization 헤더: " + request.getHeader("Authorization"));

        if (authentication == null || !authentication.isAuthenticated()) {
            System.out.println("[GetCurrentUser] 인증 실패 또는 인증 정보 없음");
            return ResponseEntity.status(401).build();
        }

        Object principal = authentication.getPrincipal();
        String email;
        System.out.println("[GetCurrentUser] 인증된 principal 타입: " + principal.getClass().getName());

        if (principal instanceof String) {
            email = (String) principal;
        } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
        } else {
            System.out.println("[GetCurrentUser] 알 수 없는 principal 타입");
            return ResponseEntity.status(401).build();
        }
        System.out.println("[GetCurrentUser] 인증된 사용자 이메일: " + email);

        return userService.findByEmail(email)
                .map(user -> {
                    System.out.println("[GetCurrentUser] 사용자 조회 성공: " + user.getEmail());
                    UserDto userDto = new UserDto(user);
                    System.out.println("[GetCurrentUser] 반환 UserDto: " + userDto);
                    return ResponseEntity.ok(userDto);
                })
                .orElseGet(() -> {
                    System.out.println("[GetCurrentUser] 사용자 없음");
                    return ResponseEntity.notFound().build();
                });
    }

    //https:localhost:8080/api/users/update
    //https://localhost:8080/api/users/update/15
    @PutMapping("/update")
    public ResponseEntity<?> update(@RequestBody Map<String, String> updateRequest) {
        try {

            String email = updateRequest.get("email");
            System.out.println("email 값은:" + email);

            String nickname = updateRequest.get("nickname");
            String mentalState = updateRequest.get("mentalState");

            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("사용자 정보를 찾을 수 없습니다."));

            user.setNickname(nickname);
            user.setMentalState(mentalState);
            userService.save(user);

            UserDto userDto = new UserDto(user);

            return ResponseEntity.ok(Map.of(
                    "user", userDto
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/delete")
    public ResponseEntity<?> delete(@RequestBody Map<String, String> deleteRequest) {
        try {
            String email = deleteRequest.get("email");

            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("사용자 정보를 찾을 수 없습니다."));
            UserDto userDto = new UserDto(user);

            userService.deleteUser(user);

            return ResponseEntity.ok(Map.of(
                    "user", userDto
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/change")
    public ResponseEntity<?> change(@RequestBody Map<String, String> changeRequest) {
        try {
            String email = changeRequest.get("email");
            String newPassword = changeRequest.get("password"); // 프론트에서 전달된 새 비밀번호

            if (newPassword == null || newPassword.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "새 비밀번호가 비어 있습니다."));
            }

            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("사용자 정보를 찾을 수 없습니다."));

            // 비밀번호 암호화 후 저장
            user.setPassword(passwordEncoder.encode(newPassword)); // <- 여기에 암호화된 비밀번호 저장
            userService.save(user);

            UserDto userDto = new UserDto(user);

            return ResponseEntity.ok(Map.of("user", userDto));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    //아이디찾기
    @PostMapping("/find-id")
    public ResponseEntity<?> findUserId(@RequestBody @Valid FindIdRequest request) {
      

        String email = userService.findUserIdByPhoneAndNickname(
                request.getPhoneNumber(), request.getNickname()
        );

        if (email != null) {
            return ResponseEntity.ok(Collections.singletonMap("email", email));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("일치하는 회원 정보를 찾을 수 없습니다.");
        }
    }

    //비번찾기-초기화
    @PostMapping("/find-password")
    public ResponseEntity<?> sendTempPassword(@RequestBody ResetPasswordRequest request) {
        String tempPassword = userService.resetPasswordByEmail(request.getEmail());

        if (tempPassword != null) {
            Map<String, String> response = new HashMap<>();
            response.put("tempPassword", tempPassword); // 프론트에서 받을 키
            return ResponseEntity.ok(response); // JSON: { "tempPassword": "임시비번" }
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("해당 이메일로 등록된 계정이 없습니다.");
        }
    }
}
