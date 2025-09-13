package com.example.backend.dto.admin;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminUserRow {
    Long id;
    String nickname;
    String email;
    String phoneNumber;
    String role;
    String gender;
    Integer age;
    String createdAt; // ISO-8601 문자열(프런트 포맷팅 가정)
}
