package com.example.backend.dto.chat;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "채팅 메시지 요청")
public class ChatMessageRequest {

    @Schema(description = "세션 ID", required = true)
    private String sessionId;

    @Schema(description = "메시지 타입", allowableValues = {"USER", "AI"})
    private ChatMessageType messageType; // ✅ ChatMessageType 사용

    @Schema(description = "메시지 내용")
    private String messageContent;

    @Schema(description = "감정 분석 결과 (JSON)")
    private String emotion;

    @Schema(description = "사용자 이메일")
    private String userEmail;

    @Schema(description = "채팅 스타일")
    private String chatStyle;
}
