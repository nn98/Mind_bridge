package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter @Setter @NoArgsConstructor
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "user_email", nullable = false)
    private String userEmail;        // user_id → userEmail 변경

    @Column(name = "user_nickname", nullable = false)
    private String userNickname;     // user_name → userNickname 변경

    @Column(nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'public'")
    private String visibility = "public";

    // 연관관계 매핑 (선택사항)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_email", referencedColumnName = "email", insertable = false, updatable = false)
    private User user;
}
