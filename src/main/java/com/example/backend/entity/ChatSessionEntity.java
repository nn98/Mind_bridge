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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 채팅 세션 엔티티 (세션 전체 정보)
 */
@Entity
@Table(name = "chat_sessions")
@Getter
@Setter
@NoArgsConstructor
public class ChatSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")  // DB 컬럼명과 정확히 매핑
    private Long sessionId;

    @Column(name = "user_email", nullable = false, length = 255)
    private String userEmail;

    @Column(name = "user_chat_summary", columnDefinition = "TEXT")
    private String userChatSummary;

    @Column(name = "user_emotion_analysis", length = 100)
    private String userEmotionAnalysis;

    @Column(name = "ai_response_summary", columnDefinition = "TEXT")
    private String aiResponseSummary;

    @Column(name = "session_status", length = 20)
    private String sessionStatus = "IN_PROGRESS";

    @Column(name = "conversation_score")
    private Integer conversationScore;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "division")
    private String division;

    @Column(name = "risk_factors")
    private String riskFactors;

    @PrePersist
    public void prePersist() {
        if (this.sessionStatus == null) {
            this.sessionStatus = "IN_PROGRESS";
        }
    }
}
