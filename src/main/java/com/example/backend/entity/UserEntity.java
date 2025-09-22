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
    @Column(name = "user_id")  // ❌ "userid" → ✅ "user_id"
    private Long userId;  // ❌ id → ✅ userId

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(length = 255)
    private String password;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(length = 100, unique = true)
    private String nickname;

    private Integer age;

    @Column(length = 20)
    private String gender;

    @Column(name = "mental_state", length = 50)
    private String mentalState;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "USER";

    @Column(length = 50)
    private String provider;

    @Column(name = "social_id", length = 100)
    private String socialId;

    @Column(name = "chat_goal", columnDefinition = "TEXT")
    private String chatGoal;

    @Column(name = "chat_style")  // ❌ "chatstyle" → ✅ "chat_style"
    private String chatStyle;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)  // ❌ "createdat" → ✅ "created_at"
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "terms_accepted", nullable = false)  // ❌ "termsaccepted" → ✅ "terms_accepted"
    @Builder.Default
    private Boolean termsAccepted = Boolean.FALSE;

    @Column(name = "terms_accepted_at", columnDefinition = "datetime(3)")  // ❌ "termsacceptedat" → ✅ "terms_accepted_at"
    private LocalDateTime termsAcceptedAt;

    @Column(name = "terms_version", length = 32)  // ❌ "termsversion" → ✅ "terms_version"
    private String termsVersion;

    @Column(name = "last_login_at")  // ❌ "lastloginat" → ✅ "last_login_at"
    private LocalDateTime lastLoginAt;

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
