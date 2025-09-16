package com.example.backend.dto.admin;

import java.util.List;

import com.example.backend.dto.user.Profile;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminStats {
    long totalUsers;
    long totalPosts;
    long todayChats;
    long todayVisits;
    long weekChats;
    long weekVisits;
    List<Profile> users;
}
