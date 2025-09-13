package com.example.backend.dto.admin;

import java.util.Map;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminUserDetail {
    Long id;
    String nickname;
    String email;
    String phoneNumber;
    String role;
    String gender;
    Integer age;
    String createdAt;
    String updatedAt;
    Boolean locked;
    Boolean active;
    Map<String, Object> extra; // 필요 시 확장
}
