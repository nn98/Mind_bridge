package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String clerkId; // Clerk 소셜 로그인 고유 ID (nullable)

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)  // 일반 회원만 비밀번호 있음
    private String password;

    @Column(nullable = false)
    private String username;
}
