package com.example.backend.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminStatsDTO {

    private long totalUsers;
    private long totalPosts;
    private List<UserDto> users;
    
}

