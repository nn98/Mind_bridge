package com.example.backend.controller;

import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.entity.UserEntity;
import com.example.backend.request.UserRequest;
import com.example.backend.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

//USETCONTROLLER 에는 회원가입/이메일 중복 확인/사용자 정보 수정/사용자 삭제/비밀번호 변경/아이디 찾기/비번 찾기
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    /**
     * ✅ 회원가입
     */
    @PostMapping("/register")
    public UserEntity register(@Valid @RequestBody UserRequest.Register req) {
        userService.register(req);
        return userService.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("회원가입 후 사용자 조회 실패"));
    }

    /**
     * ✅ 이메일 중복 확인
     */
    @PostMapping("/check-email")
    public Map<String, Boolean> checkEmail(@RequestBody Map<String, String> emailRequest) {
        String email = emailRequest.get("email");
        boolean isAvailable = userService.isEmailAvailable(email);
        return Map.of("isAvailable", isAvailable);
    }

    /**
     * ✅ 사용자 정보 수정
     */
    @PutMapping("/update")
    public UserEntity updateUser(@RequestBody UserRequest.Register req, Authentication authentication) {
        String email = authentication.getName();
        return userService.updateUser(email, req);
    }

    /**
     * ✅ 사용자 삭제
     */
    @PostMapping("/delete")
    public UserEntity deleteUser(@RequestBody Map<String, String> deleteRequest) {
        String email = deleteRequest.get("email");
        UserEntity user = userService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        userService.deleteUser(user);
        return user;
    }

    /**
     * ✅ 비밀번호 변경
     */
    @PutMapping("/change")
    public UserEntity changePassword(@RequestBody Map<String, String> changeRequest) {
        String email = changeRequest.get("email");
        String newPassword = changeRequest.get("password");

        if (newPassword == null || newPassword.isBlank()) {
            throw new RuntimeException("새 비밀번호가 비어 있습니다.");
        }

        return userService.changePassword(email, newPassword);
    }

    /**
     * ✅ 아이디 찾기
     */
    @PostMapping("/find-id")
    public Map<String, String> findUserId(@Valid @RequestBody UserRequest.FindId req) {
        String email = userService.findUserIdByPhoneAndNickname(req.getPhoneNumber(), req.getNickname());
        if (email == null) {
            throw new RuntimeException("일치하는 회원 정보를 찾을 수 없습니다.");
        }
        return Map.of("email", email);
    }

    /**
     * ✅ 비밀번호 찾기
     */
    @PostMapping("/find-password")
    public Map<String, String> resetPassword(@Valid @RequestBody UserRequest.ResetPassword req) {
        String tempPassword = userService.resetPasswordByEmail(req.getEmail());
        if (tempPassword == null) {
            throw new RuntimeException("해당 이메일로 등록된 계정이 없습니다.");
        }
        return Map.of("tempPassword", tempPassword);
    }
}
