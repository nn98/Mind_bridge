package com.example.backend.dto.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminUserSearchRequest {
    private String q;       // 닉네임/이메일/전화번호 부분 검색
    private String role;    // ROLE_USER/ROLE_ADMIN 등
    private String gender;  // MALE/FEMALE/ETC
    private Integer ageFrom;
    private Integer ageTo;
}
