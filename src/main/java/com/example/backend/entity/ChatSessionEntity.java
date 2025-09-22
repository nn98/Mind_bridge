package com.example.backend.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * 통합 채팅 세션 엔티티
 */
@Slf4j
@Entity
@Table(name = "chat_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ChatSessionEntity {

    @Id
    @Column(name = "session_id")
    private String sessionId;  // id → sessionId로 변경

    @Column(name = "user_email", nullable = true, length = 255)
    private String userEmail;

    @Column(name = "user_name", nullable = true, length = 255)
    private String userName;

    @Column(name = "summary", columnDefinition = "TEXT", nullable = true)
    private String summary;

    @Column(name = "emotions", columnDefinition = "TEXT", nullable = true)
    private String emotions;

    @Column(name = "primary_risk", columnDefinition = "TEXT", nullable = true)
    private String primaryRisk;

    @Column(name = "protective_factors", columnDefinition = "TEXT", nullable = true)
    private String protectiveFactors;

    @Column(name = "risk_factors", columnDefinition = "TEXT", nullable = true)
    private String riskFactors;

    @CreationTimestamp
    @Column(name = "created_at", nullable = true, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = true)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        log.info("\t In Entity: Creating Chat Session Entity {}", sessionId);
        if (this.sessionId == null || this.sessionId.isBlank()) {
            this.sessionId = UUID.randomUUID().toString();
        }
    }
}
