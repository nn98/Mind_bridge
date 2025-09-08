package com.example.backend.controller;

import java.net.URI;
import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
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
import com.example.backend.security.SecurityUtil;
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
    private final SecurityUtil securityUtil;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<Profile> register(@Valid @RequestBody RegistrationRequest request) {
        Profile profile = userService.register(request);
        return ResponseEntity.created(URI.create("/api/users/" + profile.getNickname())).body(profile);
    }

    @GetMapping("/availability")
    public ResponseEntity<Map<String, Boolean>> checkAvailability(@RequestParam AvailabilityType type, @RequestParam String value) {
        System.out.println("type = " + type);
        boolean isAvailable = switch (type) {
            case NICKNAME -> userService.isNicknameAvailable(value);
            case EMAIL    -> userService.isEmailAvailable(value);
            default -> throw new IllegalArgumentException("type must be nickname or email");
        };
        return ResponseEntity.ok(Map.of("isAvailable", isAvailable));
    }

    @GetMapping("/account")
    public ResponseEntity<Profile> getAccount(Authentication authentication) {
        String email = securityUtil.requirePrincipalEmail(authentication);
        Profile profile = userService.getUserByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header("Pragma", "no-cache").header("Expires", "0")
            .body(profile);
    }

    @PatchMapping("/account")
    public ResponseEntity<Void> updateAccount(@Valid @RequestBody UpdateRequest request, Authentication authentication) {
        String email = securityUtil.requirePrincipalEmail(authentication);
        userService.updateUser(email, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(Authentication authentication, HttpServletResponse response) {
        String email = securityUtil.requirePrincipalEmail(authentication);
        userService.deleteUser(email);
        jwtUtil.clearJwtCookie(response);
        return ResponseEntity.noContent().build();
    }

    /* 비밀번호 변경은 타 정보와 다르게 추가 검증 必. 동일 리소스에도 행위의 민감도는 다름.    */
    @PatchMapping("/account/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        log.info("request : {}", request);
        String email = securityUtil.requirePrincipalEmail(authentication);
        userService.changePasswordWithCurrentCheck(
            email,
            request.currentPassword(),
            request.password(),
            request.confirmPassword()  // ✅ 추가!
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<Summary> getSummary(@RequestParam String nickname) {
        return userService.getUserByNickname(nickname)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
