package com.example.backend.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 통합 채팅 세션 엔티티
 */
@Entity
@Table(name = "chat_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long sessionId;

    @Column(name = "user_email", nullable = true, length = 255)
    private String userEmail;

    @Column(name = "user_name", nullable = true, length = 255)
    private String userName;

    @Column(name = "summary", columnDefinition = "TEXT", nullable = true)
    private String summary;

    @Column(name = "emotion_summary", columnDefinition = "TEXT", nullable = true)
    private String summaryEmotion;

    @Column(name = "risk_factors", columnDefinition = "TEXT", nullable = true)
    private String riskFactors;

    @Column(name = "protective_factors", columnDefinition = "TEXT", nullable = true)
    private String protectiveFactors;

    @Column(name = "division", columnDefinition = "TEXT", nullable = true)
    private String division;

    @CreationTimestamp
    @Column(name = "created_at", nullable = true, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = true)
    private LocalDateTime updatedAt;
}
