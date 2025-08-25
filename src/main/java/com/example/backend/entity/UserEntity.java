package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    // 소셜 로그인에서 비밀번호 없을 수 있음
    @Column(length = 255)
    private String password;

    @Column(length = 100)
    private String fullName;

    @Column(length = 100)
    private String nickname;

    private Integer age;

    @Column(length = 20)
    private String gender;

    @Column(length = 50)
    private String mentalState;

    @Column(length = 20)
    private String phoneNumber;

    @Column(nullable = false, length = 20)
    private String role = "USER";

    // 소셜 로그인 관련
    @Column(length = 50)
    private String provider;  // google, kakao, naver, local

    @Column(length = 100)
    private String socialId;

    @Column(columnDefinition = "TEXT")
    private String chatGoal;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

}
