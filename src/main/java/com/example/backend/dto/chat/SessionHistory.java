package com.example.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 채팅 세션 기록 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SessionHistory {

    private Long sessionId;  // chatId → sessionId로 수정

    private String email;

    private String userChatSummary;

    private String userEmotionAnalysis;

    private String aiResponseSummary;

    private String sessionStatus;

    private Integer conversationScore;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // 추가 편의 메서드
    public String getFormattedDate() {
        return createdAt != null ? createdAt.toLocalDate().toString() : "날짜 없음";
    }

    public String getShortSummary() {
        if (userChatSummary == null || userChatSummary.length() <= 50) {
            return userChatSummary;
        }
        return userChatSummary.substring(0, 50) + "...";
    }
}
