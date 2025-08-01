package com.example.backend.dto;

import com.example.backend.entity.User;
import lombok.Getter;

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

    public UserDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.nickname = user.getNickname();
        this.gender = user.getGender();
        this.phoneNumber = user.getPhoneNumber();
        this.age = user.getAge();
        this.role = user.getRole();
        this.mentalState = user.getMentalState();
    }
}
