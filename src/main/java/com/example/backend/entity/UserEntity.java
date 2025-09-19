package com.example.backend.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 사용자 엔티티 (순수 데이터 모델)
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(length = 255)
    private String password;

    @Column(length = 100)
    private String fullName;

    @Column(length = 100, unique = true)
    private String nickname;

    private Integer age;

    @Column(length = 20)
    private String gender;

    @Column(length = 50)
    private String mentalState;

    @Column(length = 20)
    private String phoneNumber;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "USER";

    @Column(length = 50)
    private String provider;

    @Column(length = 100)
    private String socialId;

    @Column(columnDefinition = "TEXT")
    private String chatGoal;

    @Column(name = "chat_style")
    private String chatStyle;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "terms_accepted", nullable = false)
    @Builder.Default
    private Boolean termsAccepted = Boolean.FALSE;

    @Column(name = "terms_accepted_at", columnDefinition = "datetime(3)")
    private LocalDateTime termsAcceptedAt;

    @Column(name = "terms_version", length = 32)
    private String termsVersion;

    @PrePersist
    protected void onCreate() {
        if (this.role == null) {
            this.role = "USER";
        }
        if (this.termsAccepted == null) {
            this.termsAccepted = Boolean.FALSE;
        }
    }
}
