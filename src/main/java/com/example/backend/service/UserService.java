package com.example.backend.service;

import java.util.Optional;
import java.util.Random;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.backend.dto.UserRegisterRequest;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    private final JavaMailSender mailSender;

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

    //쳇모델에서 변경
    public User save(User user) {
        return userRepository.save(user);
    }

    //쳇모델 삭제
    @Transactional
    public void deleteUser(User user) {
        System.out.println("Deleting user: " + user.getEmail());
        userRepository.delete(user);
    }

    // 사용자 정보 업데이트
    public User updateUser(String email, UserRegisterRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 닉네임 변경 시 중복 확인
        if (!user.getNickname().equals(req.getNickname())
                && userRepository.existsByNickname(req.getNickname())) {
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

    //비번찾기-초기화-이메일
    public String resetPasswordByEmail(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            return null;
        }

        User user = optionalUser.get();

        // 1. 임시 비밀번호 생성
        String tempPassword = generateTempPassword();

        // 2. 이메일 발송
        sendTempPasswordEmail(user.getEmail(), tempPassword);

        // 3. 비밀번호 암호화 후 저장
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(user);

        return tempPassword; // 임시 비밀번호 리턴
    }

    //임시비밀번호 생성
    private String generateTempPassword() {
        int length = 10;
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    //이메일에 임시 비번 보내기 
    private void sendTempPasswordEmail(String toEmail, String tempPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("임시 비밀번호 안내");
        message.setText("요청하신 임시 비밀번호는 다음과 같습니다:\n\n"
                + tempPassword
                + "\n\n로그인 후 반드시 비밀번호를 변경해 주세요.");
        mailSender.send(message);
    }
}
