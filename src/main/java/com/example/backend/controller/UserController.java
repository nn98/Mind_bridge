package com.example.backend.controller;

import java.net.URI;
import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.common.ApiResponse;
import com.example.backend.dto.user.ChangePasswordRequest;
import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.RegistrationRequest;
import com.example.backend.dto.user.Summary;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 사용자 관리 관련 REST API 컨트롤러
 * 회원가입, 정보 수정, 조회, 삭제 등의 기능 제공
 */
@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    /**
     * 회원가입
     * @param request 회원가입 요청 정보
     * @return 생성된 사용자 프로필
     */
    @PostMapping("/register")
    public ResponseEntity<Profile> register(@Valid @RequestBody RegistrationRequest request) {
        Profile profile = userService.register(request);
        return ResponseEntity.created(URI.create("/api/users/" + profile.getNickname())).body(profile);
    }

    /**
     * 닉네임, 이메일 중복 확인
     * @param type 확인 종류
     * @param value 확인 값
     * @return 사용 가능 여부
     */
    @GetMapping("/availability")
    public ResponseEntity<Map<String, Boolean>> availability(@RequestParam String type, @RequestParam String value) {
        boolean isAvailable = switch (type) {
            case "nickname" -> userService.isNicknameAvailable(value);
            case "email"    -> userService.isEmailAvailable(value);
            default -> throw new IllegalArgumentException("type must be nickname or email");
        };
        return ResponseEntity.ok(Map.of("isAvailable", isAvailable));
    }

    /**
     * 현재 사용자 정보 조회
     * 프로필 = 민감 정보이므로 no-store 권장
     * @param authentication 인증 정보
     * @return 사용자 프로필
     */
    @GetMapping("/account")
    public ResponseEntity<Profile> getAccount(Authentication authentication) {
        String email = requirePrincipalEmail(authentication);
        Profile profile = userService.getUserByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header("Pragma", "no-cache").header("Expires", "0")
            .body(profile);
    }

    /**
     * 사용자 정보 수정
     * @param request 수정할 정보
     * @param authentication 인증 정보
     * @return 없음
     */
    @PatchMapping("/account")
    public ResponseEntity<Void> patchAccount(@Valid @RequestBody UpdateRequest request, Authentication authentication) {
        String email = requirePrincipalEmail(authentication);
        userService.updateUser(email, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * 비밀번호 변경
     * @param request 새 비밀번호 정보
     * @param authentication 인증 정보
     * @return 수정된 사용자 프로필
     */
    @PatchMapping("/account/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        String email = requirePrincipalEmail(authentication);
        userService.changePassword(email, request.getPassword());
        return ResponseEntity.noContent().build();
    }

    /**
     * 회원 탈퇴
     * @param authentication 인증 정보
     * @return 탈퇴 결과
     */
    @DeleteMapping("/account")
    public ResponseEntity<ApiResponse<String>> deleteUser(Authentication authentication) {
        try {
            String email = authentication.getName();
            userService.deleteUser(email);

            log.info("회원 탈퇴 완료: {}", email);
            return ResponseEntity.ok(ApiResponse.success("회원 탈퇴가 완료되었습니다."));

        } catch (RuntimeException e) {
            log.error("회원 탈퇴 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage(), null));
        }
    }

    /**
     * 닉네임으로 사용자 요약 정보 조회
     * @param nickname 조회할 닉네임
     * @return 사용자 요약 정보
     */
    @GetMapping("/summary")
    public ResponseEntity<Summary> summary(@RequestParam String nickname) {
        return userService.getUserByNickname(nickname)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private String requirePrincipalEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication required");
        }
        // principal 캐스팅이 필요한 경우:
        // Object principal = auth.getPrincipal();
        // if (principal instanceof UserDetails u) return u.getUsername();
        // else throw new AuthenticationCredentialsNotFoundException("Unsupported principal");
        return authentication.getName();
    }
}
