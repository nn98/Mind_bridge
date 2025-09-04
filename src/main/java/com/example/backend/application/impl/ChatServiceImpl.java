// service/impl/ChatServiceImpl.java
package com.example.backend.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.example.backend.api.dto.chat.MessageResponse;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.repository.ChatSessionRepository;
import com.example.backend.service.ChatService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

	private final RestTemplate restTemplate;
	private final ChatMessageRepository chatMessageRepository;
	private final ChatSessionRepository chatSessionRepository;
	private final ObjectMapper objectMapper;

	@Value("${openai.api.key}")
	private String apiKey;

	@Value("${openai.api.url}")
	private String apiUrl;

	// OpenAI API 호출하여 메시지 처리 (세션ID 포함)
	@Override
	@Transactional
	public MessageResponse processMessage(String systemPrompt, String userEmail, String userMessage) {
		// 1) 세션 신설
		ChatSessionEntity session = new ChatSessionEntity();
		session.setUserEmail(userEmail);
		session.setSessionStatus("IN_PROGRESS");
		// 필요한 초기 필드가 있으면 설정
		session = chatSessionRepository.save(session); // DB insert, auto_increment 채워짐

		Long sessionId = session.getSessionId(); // 여기서 생성된 키 확보

		// 2) 사용자 메시지 저장
		if (userMessage != null && !userMessage.isBlank()) {
			saveUserMessage(sessionId, userMessage);
		}

		// 3) OpenAI 호출
		String openAiResponse = callOpenAiApi(systemPrompt, userMessage);

		// 4) 파싱 + AI 메시지 저장
		MessageResponse parsed = parseOpenAiResponse(openAiResponse);
		parsed.setSessionId(sessionId);
		saveAiMessage(sessionId, parsed);

		return parsed;
	}

	// 새로운 채팅 세션 생성
	@Override
	@Transactional
	public Long createNewSession(String userEmail) {
		ChatSessionEntity session = new ChatSessionEntity();
		session.setUserEmail(userEmail);
		session.setSessionStatus("IN_PROGRESS");
		ChatSessionEntity savedSession = chatSessionRepository.save(session);
		log.info("새 채팅 세션 생성 - ID: {}, 사용자: {}", savedSession.getSessionId(), userEmail);
		return savedSession.getSessionId();
	}

	// 채팅 세션 완료 처리
	@Override
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

	// 세션의 모든 메시지 조회
	@Override
	@Transactional(readOnly = true)
	public List<ChatMessageEntity> getSessionMessages(Long sessionId) {
		return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
	}

	// ===== private methods =====

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

	private void saveAiMessage(Long sessionId, MessageResponse response) {
		try {
			ChatMessageEntity message = new ChatMessageEntity();
			message.setSessionId(sessionId);
			message.setMessageContent(response.getCounselorResponse());
			message.setMessageType(ChatMessageEntity.MessageType.AI);
			message.setEmotion(response.getEmotion());
			chatMessageRepository.save(message);
			log.debug("AI 응답 저장 완료 - 세션ID: {}, 감정: {}", sessionId, response.getEmotion());
		} catch (Exception e) {
			log.error("AI 응답 저장 중 오류: {}", e.getMessage(), e);
		}
	}

	private String callOpenAiApi(String systemPrompt, String userMessage) {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.setBearerAuth(apiKey);

		List<Map<String, String>> messages = List.of(
			Map.of("role", "system", "content", systemPrompt),
			Map.of("role", "user", "content", userMessage != null ? userMessage : "상담을 시작해 주세요.")
		);

		Map<String, Object> requestBody = new HashMap<>();
		requestBody.put("model", "gpt-4o-mini");
		requestBody.put("messages", messages);
		requestBody.put("temperature", 0.7);
		requestBody.put("max_tokens", 1000);

		HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
		ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, String.class);

		if (!response.getStatusCode().is2xxSuccessful()) {
			throw new RuntimeException("OpenAI API 호출 실패: " + response.getStatusCode());
		}
		return response.getBody();
	}

	private MessageResponse parseOpenAiResponse(String responseBody) {
		try {
			JsonNode rootNode = objectMapper.readTree(responseBody);
			String content = rootNode.path("choices").get(0).path("message").path("content").asText();
			try {
				return objectMapper.readValue(content, MessageResponse.class);
			} catch (Exception e) {
				log.warn("OpenAI 응답 JSON 파싱 실패: {}", e.getMessage());
				return createPlainTextResponse(content);
			}
		} catch (Exception e) {
			log.error("OpenAI 응답 처리 중 오류: {}", e.getMessage());
			return createPlainTextResponse("응답 처리 오류");
		}
	}

	private MessageResponse createPlainTextResponse(String content) {
		MessageResponse response = new MessageResponse();
		response.setEmotion("중립");
		response.setCounselorResponse(content);
		response.setSummary("텍스트 응답");
		response.setSessionEnd(false);
		return response;
	}

	private MessageResponse createErrorResponse(String errorMessage, Long sessionId) {
		MessageResponse errorResponse = new MessageResponse();
		errorResponse.setEmotion("오류");
		errorResponse.setCounselorResponse(errorMessage);
		errorResponse.setSummary("시스템 오류");
		errorResponse.setSessionEnd(false);
		errorResponse.setSessionId(sessionId != null ? sessionId : -1);
		return errorResponse;
	}
}
