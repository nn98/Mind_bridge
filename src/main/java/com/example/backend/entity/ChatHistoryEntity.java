package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")   
    private Long messageId;        // AUTO_INCREMENT PK

    @Column(name = "session_id", columnDefinition = "TEXT", nullable = false)
    private String sessionId; 

    @Column(name = "message_content", columnDefinition = "TEXT", nullable = false)
    private String messageContent; 

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 10)
    private MessageType messageType;  

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false,
            columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt; 

    @Column(name = "user_email", length = 255, nullable = false)
    private String userEmail;

    @Column(name = "chat_style", length = 45, nullable = false)
    private String chatStyle;

    @Column(name = "emotion", columnDefinition = "TEXT", nullable = false)
    private String emotion;

    public enum MessageType {
        USER, AI
    }
}
