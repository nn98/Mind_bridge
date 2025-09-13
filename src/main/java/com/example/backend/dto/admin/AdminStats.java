package com.example.backend.dto.admin;

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
}
