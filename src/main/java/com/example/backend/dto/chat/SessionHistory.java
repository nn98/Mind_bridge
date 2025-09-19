package com.example.backend.dto.chat;

import java.time.LocalDateTime;

/**
 * 세션 이력 응답용 DTO
 */
public record SessionHistory(
    Long sessionId,
    String userEmail,
    String userName,
    String sessionStatus,
    Integer conversationScore,
    String userChatSummary,
    String userEmotionAnalysis,
    String aiResponseSummary,
    String summary,
    String riskFactors,
    String protectiveFactors,
    String summaryEmotion,
    String division,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
