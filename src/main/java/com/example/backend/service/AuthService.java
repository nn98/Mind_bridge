// service/impl/AuthServiceImpl.java
package com.example.backend.service;

import static com.example.backend.dto.auth.LoginResponse.*;

import java.util.Optional;
import java.util.Random;

import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ResponseStatus;

import com.example.backend.dto.auth.FindIdRequest;
import com.example.backend.dto.auth.LoginRequest;
import com.example.backend.dto.auth.LoginResponse;
import com.example.backend.dto.auth.ResetPasswordRequest;
import com.example.backend.dto.user.Profile;
import com.example.backend.entity.UserEntity;
import com.example.backend.mapper.UserMapper;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JavaMailSender mailSender;
    private final UserMapper userMapper; // 추가

    // 로그인: 인증 → JWT 발급 → Profile 생성 → 응답 구성
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        UserEntity user = authenticateUser(request);
        String accessToken = jwtUtil.generateToken(user.getEmail());
        Profile profile = userMapper.toProfile(user); // 매퍼 사용
        return ofAccess(profile, accessToken, 84000000L);
    }

    @Transactional
    public boolean updateLastLogin(LoginRequest request) {
        UserEntity user = authenticateUser(request);
        int result = userRepository.touchLastLogin(user.getEmail());
        return result != 1;
    }

    // 아이디(이메일) 찾기 + 마스킹
    @Transactional(readOnly = true)
    public String findAndMaskUserEmail(FindIdRequest request) {
        Optional<UserEntity> optionalUser = userRepository
            .findByPhoneNumberAndNickname(request.getPhoneNumber(), request.getNickname());
        if (optionalUser.isEmpty()) {
            log.warn("아이디 찾기 실패 - 전화번호: {}, 닉네임: {}", request.getPhoneNumber(), request.getNickname());
            return null;
        }
        String email = optionalUser.get().getEmail();
        String maskedEmail = maskEmail(email);
        log.info("아이디 찾기 성공: {}", email);
        return maskedEmail;
    }

    // 비밀번호 재설정(임시 비밀번호 발급 및 메일 전송)
    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        Optional<UserEntity> optionalUser = userRepository.findByEmail(request.getEmail());
        if (optionalUser.isEmpty()) {
            log.warn("존재하지 않는 이메일로 비밀번호 재설정 시도: {}", request.getEmail());
            return null;
        }
        UserEntity user = optionalUser.get();
        if (!user.getPhoneNumber().equals(request.getPhoneNumber())) {
            log.warn("이메일과 전화번호가 일지하지 않습니다: {}", request.getEmail());
            return null;
        }
        String tempPassword = generateTempPassword();
        try {
            sendTempPasswordEmail(user.getEmail(), tempPassword);
            user.setPassword(passwordEncoder.encode(tempPassword));
            userRepository.save(user);
            log.info("비밀번호 재설정 완료: {}", user.getEmail());
            return tempPassword;
        } catch (Exception e) {
            log.error("비밀번호 재설정 실패: {}", e.getMessage());
            return null;
        }
    }

    // ===== 내부 유틸/헬퍼 =====

    private UserEntity authenticateUser(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new com.example.backend.common.error.UnauthorizedException("이메일 또는 비밀번호가 잘못되었습니다."));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new com.example.backend.common.error.UnauthorizedException("이메일 또는 비밀번호가 잘못되었습니다.");
        }
        return user;
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] parts = email.split("@", 2);
        String local = parts[0];
        String domain = parts[1];
        if (local.length() <= 2) return email;
        String masked = local.substring(0, 2) + "*".repeat(Math.max(1, local.length() - 2));
        return masked + "@" + domain;
    }

    private String generateTempPassword() {
        int length = 12;
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) sb.append(chars.charAt(random.nextInt(chars.length())));
        return sb.toString();
    }

    private void sendTempPasswordEmail(String toEmail, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("[마음챗] 임시 비밀번호 안내");
        message.setText(
            "안녕하세요. 마음챗입니다.\n\n" +
                "요청하신 임시 비밀번호는 다음과 같습니다:\n\n" +
                "임시 비밀번호: " + tempPassword + "\n\n" +
                "보안을 위해 로그인 후 반드시 비밀번호를 변경해 주세요.\n\n" +
                "감사합니다."
        );
        mailSender.send(message);
    }

    // 인증 실패 시 401로 매핑될 수 있도록 유지(선택적으로 @ControllerAdvice에서 처리해도 됨)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public static class AuthenticationException extends RuntimeException {
        public AuthenticationException(String message) { super(message); }
    }
}
