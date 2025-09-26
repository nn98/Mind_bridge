package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "emotion_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmotionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")  // ✅ id → log_id 컬럼명 변경
    private Long logId;       // ✅ 필드명도 logId로 변경 (관례 준수)

    @Column(name = "user_email", nullable = false)  // ✅ email → user_email로 변경
    private String userEmail;  // ✅ 필드명도 userEmail로 변경

    @Column(name = "input_text")
    private String inputText;

    @Column(nullable = false)
    private Integer happiness;

    @Column(nullable = false)
    private Integer sadness;

    @Column(nullable = false)
    private Integer anger;

    @Column(nullable = false)
    private Integer anxiety;

    @Column(nullable = false)
    private Integer calmness;

    @Column(nullable = false)
    private Integer etc;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
