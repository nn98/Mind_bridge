package com.example.backend.dto.chat;

import com.example.backend.entity.ChatMessageEntity.MessageType;

import lombok.Getter;
import lombok.Setter;

/**
 * 채팅 메시지 요청 DTO
 */
@Getter
@Setter
public class ChatMessageRequest {

    private String sessionId;
    private String messageContent;
    private MessageType messageType;
    private String emotion;
    private String userEmail;
	private String chatStyle;
}
