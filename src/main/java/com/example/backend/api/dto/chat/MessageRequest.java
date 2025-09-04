// dto/chat/MessageRequest.java
package com.example.backend.api.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class MessageRequest {

    @NotBlank(message = "시스템 프롬프트는 필수입니다")
    private String systemPrompt;

    private String userMessage; // 사용자가 직접 입력한 메시지 (선택사항)
    private String sessionId; // 세션 관리용
}
