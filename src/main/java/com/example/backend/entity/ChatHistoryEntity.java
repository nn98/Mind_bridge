package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_history")
@Getter
@Setter
public class ChatHistoryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(columnDefinition = "TEXT")
    private String openaiRawResponse;

    private String parsedEmotion;

    @Column(columnDefinition = "TEXT")
    private String parsedCounselorResponse;

    @Column(columnDefinition = "TEXT")
    private String parsedSummary;

    private boolean sessionEnd;

    private LocalDateTime createdAt;
}
