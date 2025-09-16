package com.example.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 검증 그룹
 */
interface OnCreate {
}

interface OnUpdate {
}

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Null(groups = OnCreate.class, message = "id must be null on create")
    @NotNull(groups = OnUpdate.class, message = "id is required on update")
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    @NotBlank(groups = OnCreate.class, message = "email is required")
    @Email(message = "invalid email format")
    @Size(max = 255, message = "email too long")
    private String email;

    // 소셜 로그인에서 비밀번호 없을 수 있음
    @Column(length = 255)
    @Size(max = 255, message = "password too long")
    private String password;

    @Column(length = 100)
    @Size(max = 100, message = "fullName too long")
    private String fullName;

    @Column(length = 100, unique = true)
    @Size(max = 100, message = "nickname too long")
    private String nickname;

    @Min(value = 1, message = "age must be >= 1")
    @Max(value = 150, message = "age must be <= 150")
    private Integer age;

    @Column(length = 20)
    @Pattern(
            regexp = "^(?i)(male|female|other|unknown)?$",
            message = "gender must be male|female|other|unknown (case-insensitive)"
    )
    @Size(max = 20, message = "gender too long")
    private String gender;

    @Column(length = 50)
    @Size(max = 50, message = "mentalState too long")
    private String mentalState;

    @Column(length = 20)
    @Pattern(
            // E.164 또는 국내 하이픈 허용 중 하나 선택:
            // E.164 예시: ^\\+?[1-9]\\d{7,14}$
            regexp = "^(\\+?[1-9]\\d{7,14}|0\\d{1,3}-\\d{3,4}-\\d{4})?$",
            message = "phoneNumber must be E.164 like +821012345678 or 0XX-XXXX-XXXX"
    )
    @Size(max = 20, message = "phoneNumber too long")
    private String phoneNumber;

    @Column(nullable = false, length = 20)
    @NotBlank(message = "role is required")
    @Pattern(regexp = "^(?i)(USER|ADMIN)$", message = "role must be USER or ADMIN (case-insensitive)")
    @Size(max = 20, message = "role too long")
    private String role = "USER";

    // 소셜 로그인 관련
    @Column(length = 50)
    @Pattern(
            regexp = "^(?i)(google|kakao|naver|local)?$",
            message = "provider must be google|kakao|naver|local"
    )
    @Size(max = 50, message = "provider too long")
    private String provider;  // google, kakao, naver, local

    @Column(length = 100)
    @Size(max = 100, message = "socialId too long")
    private String socialId;

    @Column(columnDefinition = "TEXT")
    @Size(max = 10000, message = "chatGoal too long") // TEXT이지만 애플리케이션 상한선을 둠
    private String chatGoal;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now(); // 생성 시 updatedAt도 같이 설정
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "terms_accepted", nullable = false)
    private Boolean termsAccepted = Boolean.FALSE; // tinyint(1) ↔ Boolean 매핑 [11][5]

    @Column(name = "terms_accepted_at", columnDefinition = "datetime(3)")
    private LocalDateTime termsAcceptedAt;

    @Column(name = "terms_version", length = 32)
    private String termsVersion;

    @Column(name = "chat_style")
    private String chatStyle;
}
