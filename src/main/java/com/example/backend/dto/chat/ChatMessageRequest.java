package com.example.backend.dto.chat;

import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatMessageEntity.MessageType;

/**
 * 채팅 메시지 요청 DTO
 */
public class ChatMessageRequest {

    private Long sessionId;
    private String messageContent;
    private MessageType messageType;
    private String emotion;
    private String userEmail;
    private String chatStyle;

    // 기본 생성자
    public ChatMessageRequest() {}

    // toEntity 메소드 (MapStruct 사용 시 제거 가능)
    public ChatMessageEntity toEntity() {
        ChatMessageEntity entity = new ChatMessageEntity();
        entity.setSessionId(this.sessionId);
        entity.setMessageContent(this.messageContent);
        entity.setMessageType(this.messageType);
        entity.setEmotion(this.emotion);
        entity.setUserEmail(this.userEmail);
        entity.setChatStyle(this.chatStyle);
        return entity;
    }

    // Getters and Setters
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public String getMessageContent() { return messageContent; }
    public void setMessageContent(String messageContent) { this.messageContent = messageContent; }

    public MessageType getMessageType() { return messageType; }
    public void setMessageType(MessageType messageType) { this.messageType = messageType; }

    public String getEmotion() { return emotion; }
    public void setEmotion(String emotion) { this.emotion = emotion; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getChatStyle() { return chatStyle; }
    public void setChatStyle(String chatStyle) { this.chatStyle = chatStyle; }
}
