package com.example.backend.dto;

import com.example.backend.entity.User;

import lombok.Getter;

@Getter
public class UserDto {
    private Long id;
    private String email;
    private String fullName;
    private String nickname;
    private String Gender;
    private String Age;


    public UserDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.nickname = user.getNickname();
        this.Gender = user.getGender();
        this.Age = user.getAge();
    }
}
