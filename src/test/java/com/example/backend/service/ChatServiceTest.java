// src/test/java/com/example/backend/service/ChatServiceTest.java
package com.example.backend.service;

import com.example.backend.dto.chat.MessageResponse;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.repository.ChatSessionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private ChatService chatService;

    @Test
    @DisplayName("새 채팅 세션 생성")
    void testCreateNewSession() {
        // Given
        String email = "test@example.com";

        ChatSessionEntity savedSession = new ChatSessionEntity();
        savedSession.setSessionId(1L);
        savedSession.setEmail(email);
        savedSession.setSessionStatus("IN_PROGRESS");

        when(chatSessionRepository.save(any(ChatSessionEntity.class))).thenReturn(savedSession);

        // When
        Long result = chatService.createNewSession(email);

        // Then
        assertThat(result).isEqualTo(1L);
        verify(chatSessionRepository).save(any(ChatSessionEntity.class));
    }

    @Test
    @DisplayName("세션의 모든 메시지 조회")
    void testGetSessionMessages() {
        // Given
        Long sessionId = 1L;
        List<ChatMessageEntity> messages = Arrays.asList(
                createTestChatMessage(1L, "사용자 메시지", ChatMessageEntity.MessageType.USER),
                createTestChatMessage(2L, "AI 응답", ChatMessageEntity.MessageType.AI)
        );

        when(chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId)).thenReturn(messages);

        // When
        List<ChatMessageEntity> result = chatService.getSessionMessages(sessionId);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getMessageContent()).isEqualTo("사용자 메시지");
        assertThat(result.get(1).getMessageContent()).isEqualTo("AI 응답");

        verify(chatMessageRepository).findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    // Helper 메서드들
    private ChatMessageEntity createTestChatMessage(Long id, String content, ChatMessageEntity.MessageType type) {
        ChatMessageEntity message = new ChatMessageEntity();
        message.setMessageId(id);
        message.setSessionId(1L);
        message.setMessageContent(content);
        message.setMessageType(type);
        message.setCreatedAt(LocalDateTime.now());
        return message;
    }
}
