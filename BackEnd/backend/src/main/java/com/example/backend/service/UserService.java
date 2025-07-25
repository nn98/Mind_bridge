package com.example.backend.service;

import com.example.backend.dto.ClerkUserRequest;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // 일반 회원가입
    public User registerUser(String username, String password, String email) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        return userRepository.save(user);
    }

    // 로그인 인증
    public User authenticate(String username, String rawPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if (user.getPassword() == null || !passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }
        return user;
    }

    // Clerk 회원가입
    public User registerClerkUser(ClerkUserRequest request) {
        User user = new User();
        user.setClerkId(request.getUserId());
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(null);  // 소셜 로그인 유저는 비밀번호 없음
        return userRepository.save(user);
    }

    // Clerk ID로 조회
    public Optional<User> findByClerkId(String clerkId) {
        return userRepository.findByClerkId(clerkId);
    }
}
