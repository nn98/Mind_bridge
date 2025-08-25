package com.example.backend.service;

import com.example.backend.dto.chat.MessageResponse;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.repository.ChatSessionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final RestTemplate restTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ObjectMapper objectMapper;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    /**
     * OpenAI API 호출하여 메시지 처리 (세션ID 포함)
     */
    @Transactional
    public MessageResponse processMessage(String systemPrompt, Long sessionId, String userMessage) {
        try {
            // 사용자 메시지 저장 (있는 경우)
            if (userMessage != null && !userMessage.trim().isEmpty()) {
                saveUserMessage(sessionId, userMessage);
            }

            // OpenAI API 요청
            String openAiResponse = callOpenAiApi(systemPrompt, userMessage);

            // 응답 파싱
            MessageResponse parsedResponse = parseOpenAiResponse(openAiResponse);
            parsedResponse.setSessionId(sessionId.toString());

            // AI 응답 저장
            saveAiMessage(sessionId, parsedResponse);

            return parsedResponse;

        } catch (Exception e) {
            log.error("OpenAI API 호출 중 오류 발생: {}", e.getMessage(), e);
            return createErrorResponse("OpenAI 응답 오류", sessionId);
        }
    }

    /**
     * 새로운 채팅 세션 생성
     */
    @Transactional
    public Long createNewSession(String email) {
        ChatSessionEntity session = new ChatSessionEntity();
        session.setEmail(email);
        session.setSessionStatus("IN_PROGRESS");

        ChatSessionEntity savedSession = chatSessionRepository.save(session);
        log.info("새 채팅 세션 생성 - ID: {}, 사용자: {}", savedSession.getSessionId(), email);

        return savedSession.getSessionId();
    }

    /**
     * 채팅 세션 완료 처리
     */
    @Transactional
    public void completeSession(Long sessionId, String summary, String emotion, String aiSummary, Integer score) {
        Optional<ChatSessionEntity> sessionOpt = chatSessionRepository.findById(sessionId);

        if (sessionOpt.isPresent()) {
            ChatSessionEntity session = sessionOpt.get();
            session.setUserChatSummary(summary);
            session.setUserEmotionAnalysis(emotion);
            session.setAiResponseSummary(aiSummary);
            session.setConversationScore(score);
            session.setSessionStatus("COMPLETED");

            chatSessionRepository.save(session);
            log.info("채팅 세션 완료 - ID: {}", sessionId);
        }
    }

    /**
     * 세션의 모든 메시지 조회
     */
    @Transactional(readOnly = true)
    public List<ChatMessageEntity> getSessionMessages(Long sessionId) {
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    // === Private Methods ===

    /**
     * 사용자 메시지 저장
     */
    private void saveUserMessage(Long sessionId, String userMessage) {
        try {
            ChatMessageEntity message = new ChatMessageEntity();
            message.setSessionId(sessionId);
            message.setMessageContent(userMessage);
            message.setMessageType(ChatMessageEntity.MessageType.USER);

            chatMessageRepository.save(message);
            log.debug("사용자 메시지 저장 완료 - 세션ID: {}", sessionId);

        } catch (Exception e) {
            log.error("사용자 메시지 저장 중 오류: {}", e.getMessage(), e);
        }
    }

    /**
     * AI 응답 메시지 저장
     */
    private void saveAiMessage(Long sessionId, MessageResponse response) {
        try {
            ChatMessageEntity message = new ChatMessageEntity();
            message.setSessionId(sessionId);
            message.setMessageContent(response.getCounselorResponse());
            message.setMessageType(ChatMessageEntity.MessageType.AI);
            message.setEmotion(response.getEmotion());  // 감정 정보 저장

            chatMessageRepository.save(message);
            log.debug("AI 응답 저장 완료 - 세션ID: {}, 감정: {}", sessionId, response.getEmotion());

        } catch (Exception e) {
            log.error("AI 응답 저장 중 오류: {}", e.getMessage(), e);
        }
    }

    /**
     * OpenAI API 호출
     */
    private String callOpenAiApi(String systemPrompt, String userMessage) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        // 메시지 구성
        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage != null ? userMessage : "상담을 시작해 주세요.")
        );

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4o-mini");  // 최신 모델 사용
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 1000);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                entity,
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("OpenAI API 호출 실패: " + response.getStatusCode());
        }

        return response.getBody();
    }

    /**
     * OpenAI 응답 파싱
     */
    private MessageResponse parseOpenAiResponse(String responseBody) {
        try {
            JsonNode rootNode = objectMapper.readTree(responseBody);
            String content = rootNode.path("choices").get(0).path("message").path("content").asText();

            // JSON 파싱 시도
            try {
                return objectMapper.readValue(content, MessageResponse.class);
            } catch (Exception e) {
                // 파싱 실패시 기본값 반환
                log.warn("OpenAI 응답 JSON 파싱 실패: {}", e.getMessage());
                return createPlainTextResponse(content);
            }

        } catch (Exception e) {
            log.error("OpenAI 응답 처리 중 오류: {}", e.getMessage());
            return createPlainTextResponse("응답 처리 오류");
        }
    }

    /**
     * 일반 텍스트를 MessageResponse로 변환
     */
    private MessageResponse createPlainTextResponse(String content) {
        MessageResponse response = new MessageResponse();
        response.setEmotion("중립");
        response.setCounselorResponse(content);
        response.setSummary("텍스트 응답");
        response.setSessionEnd(false);
        return response;
    }

    /**
     * 오류 응답 생성
     */
    private MessageResponse createErrorResponse(String errorMessage, Long sessionId) {
        MessageResponse errorResponse = new MessageResponse();
        errorResponse.setEmotion("오류");
        errorResponse.setCounselorResponse(errorMessage);
        errorResponse.setSummary("시스템 오류");
        errorResponse.setSessionEnd(false);
        errorResponse.setSessionId(sessionId != null ? sessionId.toString() : "unknown");
        return errorResponse;
    }
}
