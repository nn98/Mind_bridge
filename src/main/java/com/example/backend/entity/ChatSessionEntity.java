package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

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

    @Column(nullable = false, length = 255)
    private String email;

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

    @PrePersist
    public void prePersist() {
        if (this.sessionStatus == null) {
            this.sessionStatus = "IN_PROGRESS";
        }
    }
}
