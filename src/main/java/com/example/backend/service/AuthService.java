package com.example.backend.service;

import com.example.backend.dto.auth.FindIdRequest;
import com.example.backend.dto.auth.LoginRequest;
import com.example.backend.dto.auth.LoginResponse;
import com.example.backend.dto.auth.ResetPasswordRequest;
import com.example.backend.dto.user.Profile;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.Optional;
import java.util.Random;

/**
 * 인증 관련 비즈니스 로직을 처리하는 서비스
 * 로그인, 패스워드 재설정, 아이디 찾기 등의 기능 제공
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JavaMailSender mailSender;

    /**
     * 사용자 로그인 처리 (JWT 토큰 생성 포함)
     */
    public LoginResponse login(LoginRequest request) {
        // 1. 사용자 인증
        UserEntity user = authenticateUser(request);

        // 2. JWT 토큰 생성 (비즈니스 로직)
        String accessToken = jwtUtil.generateToken(user.getEmail());

        // 3. 사용자 프로필 생성
        Profile profile = new Profile(user);

        // 4. 로그인 응답 생성
        return new LoginResponse(accessToken, profile);
    }

    /**
     * 아이디 찾기 및 마스킹 처리
     */
    public String findAndMaskUserEmail(FindIdRequest request) {
        Optional<UserEntity> optionalUser = userRepository
                .findByPhoneNumberAndNickname(request.getPhoneNumber(), request.getNickname());

        if (optionalUser.isEmpty()) {
            log.warn("아이디 찾기 실패 - 전화번호: {}, 닉네임: {}",
                    request.getPhoneNumber(), request.getNickname());
            return null;
        }

        String email = optionalUser.get().getEmail();
        String maskedEmail = maskEmail(email);
        log.info("아이디 찾기 성공: {}", email);
        return maskedEmail;
    }

    /**
     * 비밀번호 재설정
     */
    public boolean resetPassword(ResetPasswordRequest request) {
        Optional<UserEntity> optionalUser = userRepository.findByEmail(request.getEmail());
        if (optionalUser.isEmpty()) {
            log.warn("존재하지 않는 이메일로 비밀번호 재설정 시도: {}", request.getEmail());
            return false;
        }

        UserEntity user = optionalUser.get();
        String tempPassword = generateTempPassword();

        try {
            // 1. 이메일 발송
            sendTempPasswordEmail(user.getEmail(), tempPassword);

            // 2. 비밀번호 업데이트
            user.setPassword(passwordEncoder.encode(tempPassword));
            userRepository.save(user);

            log.info("비밀번호 재설정 완료: {}", user.getEmail());
            return true;

        } catch (Exception e) {
            log.error("비밀번호 재설정 실패: {}", e.getMessage());
            return false;
        }
    }

    // === Private Helper Methods ===

    /**
     * 사용자 인증 처리
     */
    private UserEntity authenticateUser(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("이메일 또는 비밀번호가 잘못되었습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthenticationException("이메일 또는 비밀번호가 잘못되었습니다.");
        }

        return user;
    }

    /**
     * 이메일 마스킹 처리 (비즈니스 로직)
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }

        String[] parts = email.split("@");
        String localPart = parts[0];
        String domainPart = parts[1];

        if (localPart.length() <= 2) {
            return email;
        }

        String masked = localPart.substring(0, 2) + "*".repeat(localPart.length() - 2);
        return masked + "@" + domainPart;
    }

    /**
     * 임시 비밀번호 생성
     */
    private String generateTempPassword() {
        int length = 12;
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();

        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * 임시 비밀번호 이메일 발송
     */
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

    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public class AuthenticationException extends RuntimeException {
        public AuthenticationException(String message) {
            super(message);
        }
    }

}
