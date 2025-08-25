package com.example.backend.dto.response;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class UserDto {
    private Long id;
    private String email;
    private String fullName;
    private String nickname;
    private String phoneNumber;
    private String gender;      // Gender → gender (소문자)
    private Integer age;        // String → Integer 변경
    private String role;
    private String mentalState;
}
