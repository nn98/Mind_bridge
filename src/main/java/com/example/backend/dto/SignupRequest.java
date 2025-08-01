package com.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {
    private String email;
    private String password;
    private String fullName;
    private String nickname;
    private String phoneNumber;
    private String mentalState;
    private String Gender;
    private String Age;
    private String role;  // 예: USER, ADMIN

}
