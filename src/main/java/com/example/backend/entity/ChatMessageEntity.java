package com.example.backend.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.example.backend.dto.chat.ChatMessageType; // ✅ 외부 enum import

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * 통합 채팅 메시지 엔티티
 */
@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "session_id", nullable = false, length = 255)
    private String sessionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, columnDefinition = "enum('AI','USER')")
    private ChatMessageType messageType; // ✅ 내부 enum 제거하고 외부 enum 사용

    @Column(name = "message_content", columnDefinition = "TEXT")
    private String messageContent;

    @Column(name = "emotion", columnDefinition = "TEXT")
    private String emotion;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Column(name = "chat_style", nullable = false, length = 45)
    @Builder.Default
    private String chatStyle = "default";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
