package com.example.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.AdminStatsDTO;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @GetMapping("/stats")
    public AdminStatsDTO getAdminStats() {
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();

        List<AdminStatsDTO.UserDto> users = userRepository.findAll()
        .stream()
        .map(u -> new AdminStatsDTO.UserDto(
                u.getNickname(),
                u.getEmail(),
                u.getPhoneNumber()
        ))
        .toList();


        return new AdminStatsDTO(totalUsers, totalPosts, users);
    }
}
