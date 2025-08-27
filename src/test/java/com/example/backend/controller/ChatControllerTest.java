// src/test/java/com/example/backend/controller/ChatControllerTest.java
package com.example.backend.controller;

import com.example.backend.config.TestConfig;
import com.example.backend.dto.chat.MessageRequest;
import com.example.backend.dto.chat.MessageResponse;
import com.example.backend.dto.chat.SessionHistory;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.security.CustomUserDetailsService;
import com.example.backend.security.JwtUtil;
import com.example.backend.security.TestMailConfig;
import com.example.backend.service.ChatService;
import com.example.backend.service.ChatSessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ChatController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@WithMockUser(username = "test@example.com", roles = {"USER"})
@Import({TestConfig.class, JwtUtil.class, TestMailConfig.class})
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ChatSessionService chatSessionService;

    @MockitoBean
    private ChatService chatService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("새 채팅 세션 시작")
    void testStartNewSession() throws Exception {
        // Given
        String email = "test@example.com";
        Long sessionId = 1L;

        when(chatService.createNewSession(email)).thenReturn(sessionId);

        // When & Then
        mockMvc.perform(post("/api/chat/session/start")
                        .param("email", email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(1));

        verify(chatService).createNewSession(email);
    }

    @Test
    @DisplayName("메시지 전송 및 AI 응답")
    void testSendMessage() throws Exception {
        // Given
        MessageRequest request = new MessageRequest();
        request.setSystemPrompt("상담사로 역할하세요");
        request.setUserMessage("안녕하세요");
        request.setSessionId("1");

        MessageResponse response = new MessageResponse();
        response.setEmotion("긍정");
        response.setCounselorResponse("안녕하세요! 어떤 도움이 필요하신가요?");
        response.setSummary("인사");
        response.setSessionEnd(false);
        response.setSessionId("1");

        when(chatService.processMessage("상담사로 역할하세요", 1L, "안녕하세요"))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/chat/message")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.감정").value("긍정"))
                .andExpect(jsonPath("$.data.상담사_응답").value("안녕하세요! 어떤 도움이 필요하신가요?"));

        verify(chatService).processMessage("상담사로 역할하세요", 1L, "안녕하세요");
    }

    @Test
    @DisplayName("채팅 세션 저장")
    void testSaveSession() throws Exception {
        // Given
        SessionRequest request = new SessionRequest();
        request.setEmail("test@example.com");
        request.setUserChatSummary("사용자 대화 요약");
        request.setUserEmotionAnalysis("긍정적");
        request.setAiResponseSummary("AI 응답 요약");
        request.setConversationScore(8);

        SessionHistory savedSession = new SessionHistory();
        savedSession.setSessionId(1L);
        savedSession.setEmail("test@example.com");
        savedSession.setUserChatSummary("사용자 대화 요약");

        when(chatSessionService.saveSession(any(SessionRequest.class)))
                .thenReturn(savedSession);

        // When & Then
        mockMvc.perform(post("/api/chat/session/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("test@example.com"));

        verify(chatSessionService).saveSession(any(SessionRequest.class));
    }

    @Test
    @DisplayName("사용자별 채팅 세션 목록 조회")
    void testGetUserSessions() throws Exception {
        // Given
        String email = "test@example.com";
        List<SessionHistory> sessions = Arrays.asList(
                createTestSessionHistory(1L, email),
                createTestSessionHistory(2L, email)
        );

        when(chatSessionService.getSessionsByEmail(email)).thenReturn(sessions);

        // When & Then
        mockMvc.perform(get("/api/chat/sessions")
                        .param("email", email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(2)));

        verify(chatSessionService).getSessionsByEmail(email);
    }

    private SessionHistory createTestSessionHistory(Long sessionId, String email) {
        return new SessionHistory(
                sessionId,
                email,
                "테스트 요약",
                "긍정적",
                "AI 요약",
                "COMPLETED",
                8,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }
}
