package com.example.backend.dto.chat;

import com.example.backend.entity.ChatHistoryEntity;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {

    private String sessionId;
    private String messageContent;
    private String messageType;   
    private String userEmail;
    private String chatStyle;
    private String emotion;

    // DTO → Entity 변환
    public ChatHistoryEntity toEntity() {
        return ChatHistoryEntity.builder()
                .sessionId(this.sessionId)
                .messageContent(this.messageContent)
                .messageType(ChatHistoryEntity.MessageType.valueOf(this.messageType.toUpperCase()))
                .userEmail(this.userEmail)
                .chatStyle(this.chatStyle)
                .emotion(this.emotion)
                .build();
    }
}
