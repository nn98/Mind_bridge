package com.example.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.user.Profile;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    //총 게시글수 와 총 유저수 확인
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();

        Map<String, Object> response = new HashMap<>();

        List<Profile> users = userRepository.findAll()
            .stream()
            .map(u -> Profile.builder()
                .nickname(u.getNickname())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .gender(u.getGender())
                .age(u.getAge())
                .build()
            )
            .toList();

        response.put("totalUsers", totalUsers);
        response.put("totalPosts", totalPosts);
        response.put("users", users);

        return ResponseEntity.ok(response);
    }
}
