package com.example.backend.dto.user;

import com.example.backend.entity.UserEntity;

import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public class Summary {
    private Long id;
    private String nickname;
    private String mentalState;
    private Integer age;
    private String gender;

    // UserEntity 받는 생성자 추가
    public Summary(UserEntity user) {
        this.id = user.getId();
        this.nickname = user.getNickname();
        this.mentalState = user.getMentalState();
        this.age = user.getAge();
        this.gender = user.getGender();
    }

    // 기존 생성자 유지
    public Summary(Long id, String nickname, String mentalState, Integer age, String gender) {
        this.id = id;
        this.nickname = nickname;
        this.mentalState = mentalState;
        this.age = age;
        this.gender = gender;
    }
}
