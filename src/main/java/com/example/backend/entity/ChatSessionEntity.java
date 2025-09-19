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

    @Column(name = "session_status", length = 20, nullable = true)
    @Builder.Default
    private String sessionStatus = "IN_PROGRESS";

    @Column(name = "conversation_score", nullable = true)
    private Integer conversationScore;

    @Column(name = "user_chat_summary", columnDefinition = "TEXT", nullable = true)
    private String userChatSummary;

    @Column(name = "user_emotion_analysis", length = 100, nullable = true)
    private String userEmotionAnalysis;

    @Column(name = "summary", columnDefinition = "TEXT", nullable = true)
    private String summary;

    @Column(name = "summary_emotion", columnDefinition = "TEXT", nullable = true)
    private String summaryEmotion;

    @Column(name = "ai_response_summary", columnDefinition = "TEXT", nullable = true)
    private String aiResponseSummary;

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

    @PrePersist
    public void prePersist() {
        if (this.sessionStatus == null) {
            this.sessionStatus = "IN_PROGRESS";
        }
    }
}
