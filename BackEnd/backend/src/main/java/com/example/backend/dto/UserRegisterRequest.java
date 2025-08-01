package com.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRegisterRequest {
    private String email;
    private String password;
    private String nickname;
    private String phoneNumber;
    private String mentalState;
    private String Gender;
    private String Age;
    
}
