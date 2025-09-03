// service/AuthService.java
package com.example.backend.service;

import com.example.backend.dto.auth.FindIdRequest;
import com.example.backend.dto.auth.LoginRequest;
import com.example.backend.dto.auth.LoginResponse;
import com.example.backend.dto.auth.ResetPasswordRequest;

public interface AuthService {

    // 로그인 (JWT 발급 + 프로필 포함 응답)
    LoginResponse login(LoginRequest request);

    boolean updateLastLogin(LoginRequest request);

    // 아이디(이메일) 찾기 + 마스킹
    String findAndMaskUserEmail(FindIdRequest request);

    // 비밀번호 재설정(임시 비밀번호 발급/전송), 성공 시 임시 비밀번호 반환(또는 토큰/플래그)
    String resetPassword(ResetPasswordRequest request);

    // 인증 실패 예외 타입(컨트롤러 advice에서 처리 가능)
    class AuthenticationException extends RuntimeException {
        public AuthenticationException(String message) {
            super(message);
        }
    }
}
