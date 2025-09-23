package com.example.backend.security;

import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.backend.entity.UserEntity;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByEmail(email)
                      .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new org.springframework.security.core.userdetails.User(
            user.getEmail(),
            user.getPassword(),
            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase()))
        );
    }

    // 소셜 로그인 사용자 처리 예제 메소드
    public UserDetails loadOrCreateUserByEmail(String email, String nickname) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    UserEntity newUser = new UserEntity();
                    newUser.setEmail(email);
                    newUser.setNickname(nickname);
                    newUser.setRole("USER"); // 기본 권한 설정
                    // 소셜 로그인용 유저는 비밀번호는 임의로 생성하거나 null일 수 있음
                    newUser.setPassword("");
                    return userRepository.save(newUser);
                });

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword() != null ? user.getPassword() : "",
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase()))
        );
    }
}
