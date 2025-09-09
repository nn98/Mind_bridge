package com.example.backend.controller;

import java.net.URI;
import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.user.AvailabilityType;
import com.example.backend.dto.user.ChangePasswordRequest;
import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.RegistrationRequest;
import com.example.backend.dto.user.Summary;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.security.JwtUtil;
import com.example.backend.service.UserService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<Profile> register(@Valid @RequestBody RegistrationRequest request) {
        Profile profile = userService.register(request);
        return ResponseEntity.created(URI.create("/api/users/" + profile.getNickname())).body(profile);
    }

    @GetMapping("/availability")
    public ResponseEntity<Map<String, Boolean>> checkAvailability(@RequestParam AvailabilityType type, @RequestParam String value) {
        boolean isAvailable = switch (type) {
            case NICKNAME -> userService.isNicknameAvailable(value);
            case EMAIL    -> userService.isEmailAvailable(value);
        };
        return ResponseEntity.ok(Map.of("isAvailable", isAvailable));
    }

    @GetMapping("/account")
    public ResponseEntity<Profile> getAccount(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("Authentication required");
        }
        log.info("Get account for email {}", authentication.getName());
        Profile profile = userService.getUserByEmail(authentication.getName()).orElseThrow(() -> new NotFoundException("User not found"));
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header("Pragma", "no-cache").header("Expires", "0")
            .header("Vary", "Cookie").body(profile);
    }

    @PatchMapping("/account")
    public ResponseEntity<Void> updateAccount(@Valid @RequestBody UpdateRequest request, @AuthenticationPrincipal(expression = "username") String email) {
        userService.updateUser(email, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal(expression = "username") String email, HttpServletResponse response) {
        userService.deleteUser(email);
        jwtUtil.clearJwtCookie(response);
        return ResponseEntity.noContent().build();
    }

    /* 비밀번호 변경은 타 정보와 다르게 추가 검증 必. 동일 리소스에도 행위의 민감도는 다름.    */
    @PatchMapping("/account/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
        @AuthenticationPrincipal(expression = "username") String email, HttpServletResponse httpRes) {
        log.info("request : {}", request);
        userService.changePasswordWithCurrentCheck(
            email,
            request.currentPassword(),
            request.password(),
            request.confirmPassword()  // ✅ 추가!
        );

        jwtUtil.clearJwtCookie(httpRes);                         // 전송 계층 책임(쿠키 삭제)
        return ResponseEntity.status(303)
            .header("Location", "/")
            .header("Cache-Control", "no-store")
            .header("Pragma", "no-cache")
            .header("Expires", "0")
            .build();
    }

    @GetMapping("/summary")
    public ResponseEntity<Summary> getSummary(@RequestParam String nickname) {
        return userService.getUserByNickname(nickname)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }
    


}
