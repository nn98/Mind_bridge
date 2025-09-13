package com.example.backend.dto.admin;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminPostRow {
    Long id;
    String title;
    String authorNickname;
    String authorEmail;
    String visibility; // public|private
    String createdAt;
}
