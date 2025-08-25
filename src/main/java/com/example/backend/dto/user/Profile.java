package com.example.backend.dto.user;

import com.example.backend.entity.UserEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor  // 기본 생성자 추가
@AllArgsConstructor // 모든 필드 생성자
public class Profile {

    private Long id;
    private String email;
    private String fullName;
    private String nickname;
    private String gender;
    private Integer age;
    private String phoneNumber;
    private String mentalState;
    private String chatGoal;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Profile(UserEntity user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.nickname = user.getNickname();
        this.age = user.getAge();
        this.gender = user.getGender();
        this.mentalState = user.getMentalState();
        this.role = user.getRole();
    }
}
