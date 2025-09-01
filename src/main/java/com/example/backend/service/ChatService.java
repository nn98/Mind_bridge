// service/ChatService.java
package com.example.backend.service;

import java.util.List;
import com.example.backend.dto.chat.MessageResponse;
import com.example.backend.entity.ChatMessageEntity;

public interface ChatService {

    // OpenAI 호출 포함 메시지 처리(세션ID 포함)
    MessageResponse processMessage(String systemPrompt, String userEmail, String userMessage);

    // 새로운 채팅 세션 생성
    Long createNewSession(String email);

    // 채팅 세션 완료 처리
    void completeSession(Long sessionId, String summary, String emotion, String aiSummary, Integer score);

    // 세션의 모든 메시지 조회
    List<ChatMessageEntity> getSessionMessages(Long sessionId);
}
