package com.example.backend.controller;

import java.net.URI;
import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.common.ApiResponse;
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
     * 이메일 중복 확인
     * @param email 확인할 이메일
     * @return 사용 가능 여부
     */
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkEmail(@RequestParam("email") String email) {
        try {
            boolean isAvailable = userService.isEmailAvailable(email);
            return ResponseEntity.ok(
                ApiResponse.success(Map.of("isAvailable", isAvailable))
            );
        } catch (Exception e) {
            log.error("이메일 중복 확인 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("이메일 중복 확인에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 닉네임 중복 확인
     * @param nickname 확인할 닉네임
     * @return 사용 가능 여부
     */
    @GetMapping("/{nickname}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkNickname(@PathVariable String nickname) {
        try {
            boolean isAvailable = userService.isNicknameAvailable(nickname);
            return ResponseEntity.ok(ApiResponse.success(Map.of("isAvailable", isAvailable)));
        } catch (Exception e) {
            log.error("닉네임 중복 확인 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("닉네임 중복 확인에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 현재 사용자 정보 조회
     * @param authentication 인증 정보
     * @return 사용자 프로필
     */
    // 프로필 조회: 민감 정보이므로 no-store 권장
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Profile>> getUserProfile(Authentication authentication) {
        try {
            String email = authentication.getName();
            Profile profile = userService.getUserByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
            return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(ApiResponse.success(profile));
        } catch (Exception e) {
            log.error("사용자 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(ApiResponse.error("사용자 정보 조회에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 닉네임으로 사용자 요약 정보 조회
     * @param nickname 조회할 닉네임
     * @return 사용자 요약 정보
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Summary>> getUserSummary(@RequestParam String nickname) {
        try {
            log.info(userService.getUserByNickname(nickname).toString());
            return userService.getUserByNickname(nickname)
                .map(summary -> ResponseEntity.ok(ApiResponse.success(summary)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("사용자를 찾을 수 없습니다.", null)));

        } catch (Exception e) {
            log.error("사용자 요약 정보 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("사용자 정보 조회에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 사용자 정보 수정
     * @param request 수정할 정보
     * @param authentication 인증 정보
     * @return 수정된 사용자 프로필
     */
    // 프로필 수정: 저장 직후 최신 DTO 반환 및 캐시 금지
    @PutMapping("/update")
    public ResponseEntity<ApiResponse<Profile>> updateUser(
        @RequestBody UpdateRequest request,
        Authentication authentication) {
        try {
            String email = authentication.getName();
            Profile updated = userService.updateUser(email, request);
            log.info("사용자 정보 수정 완료: {}", email);
            return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(ApiResponse.success(updated));
        } catch (RuntimeException e) {
            log.error("사용자 정보 수정 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Expires", "0")
                .body(ApiResponse.error(e.getMessage(), null));
        }
    }

    /**
     * 비밀번호 변경
     * @param request 새 비밀번호 정보
     * @param authentication 인증 정보
     * @return 수정된 사용자 프로필
     */
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<String>> changePassword(
        @RequestBody Map<String, String> request,
        Authentication authentication) {
        try {
            String email = authentication.getName();
            String newPassword = request.get("newPassword");

            if (newPassword == null || newPassword.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("새 비밀번호가 비어 있습니다.", null));
            }

            userService.changePassword(email, newPassword);
            log.info("비밀번호 변경 완료: {}", email);

            return ResponseEntity.ok(ApiResponse.success("비밀번호가 성공적으로 변경되었습니다."));

        } catch (RuntimeException e) {
            log.error("비밀번호 변경 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage(), null));
        }
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
}
