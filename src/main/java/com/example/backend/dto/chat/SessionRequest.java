package com.example.backend.dto.chat;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * 채팅 세션 저장 요청 DTO
 */
@Getter
@Setter
public class SessionRequest {

    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String userEmail;

    @Size(max = 1000, message = "사용자 대화 요약은 1000자 이내로 입력해주세요")
    private String userChatSummary; // userCounsellingSummation → userChatSummary

    @Size(max = 100, message = "감정 분석은 100자 이내로 입력해주세요")
    private String userEmotionAnalysis; // userCounsellingEmotion → userEmotionAnalysis

    @Size(max = 1000, message = "AI 응답 요약은 1000자 이내로 입력해주세요")
    private String aiResponseSummary; // counselorSummation → aiResponseSummary

    private Integer conversationScore; // 대화 점수 (1-10)
}
