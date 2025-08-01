package com.example.backend.service;

import com.example.backend.dto.UserRegisterRequest;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public void register(UserRegisterRequest req) {
        // 이메일 중복 확인
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("이미 사용중인 이메일입니다.");
        }

        // 닉네임 중복 확인 (외래키 참조를 위해 고유해야 함)
        if (userRepository.existsByNickname(req.getNickname())) {
            throw new RuntimeException("이미 사용중인 닉네임입니다.");
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getFullName());         // fullName 추가
        user.setNickname(req.getNickname());
        user.setGender(req.getGender());             // gender 추가
        user.setAge(req.getAge());                   // age 추가 (Integer)
        user.setPhoneNumber(req.getPhoneNumber());
        user.setMentalState(req.getMentalState());
        user.setRole("USER");

        userRepository.save(user);
    }

    public String login(String email, String password) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        return jwtUtil.generateToken(email);
    }

    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(email);
    }

    public boolean isNicknameAvailable(String nickname) {
        return !userRepository.existsByNickname(nickname);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findByNickname(String nickname) {
        return userRepository.findByNickname(nickname);
    }

    // 사용자 정보 업데이트
    public User updateUser(String email, UserRegisterRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 닉네임 변경 시 중복 확인
        if (!user.getNickname().equals(req.getNickname()) &&
                userRepository.existsByNickname(req.getNickname())) {
            throw new RuntimeException("이미 사용중인 닉네임입니다.");
        }

        user.setFullName(req.getFullName());
        user.setNickname(req.getNickname());
        user.setGender(req.getGender());
        user.setAge(req.getAge());
        user.setPhoneNumber(req.getPhoneNumber());
        user.setMentalState(req.getMentalState());

        return userRepository.save(user);
    }
}
