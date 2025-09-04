// service/impl/ChatSessionServiceImpl.java
package com.example.backend.application.impl;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.api.dto.chat.SessionHistory;
import com.example.backend.api.dto.chat.SessionRequest;
import com.example.backend.infrastructure.persistence.entity.ChatSessionEntity;
import com.example.backend.domain.chat.ChatSessionRepository;
import com.example.backend.application.service.ChatSessionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatSessionServiceImpl implements ChatSessionService {

	private final ChatSessionRepository chatSessionRepository;

	@Override
	@Transactional
	public SessionHistory saveSession(SessionRequest request) {
		ChatSessionEntity entity = createChatSessionEntity(request);
		ChatSessionEntity savedEntity = chatSessionRepository.save(entity);
		log.info("새 채팅 세션 저장 완료 - ID: {}, 사용자: {}", savedEntity.getSessionId(), savedEntity.getUserEmail());
		return mapToSessionHistory(savedEntity);
	}

	@Override
	@Transactional(readOnly = true)
	public List<SessionHistory> getSessionsByUserEmail(String userEmail) {
		List<ChatSessionEntity> sessions = chatSessionRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
		return sessions.stream().map(this::mapToSessionHistory).collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public long getCompletedSessionCount(String userEmail) {
		return chatSessionRepository.countCompletedSessionsByUserEmail(userEmail);
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<SessionHistory> getActiveSession(String userEmail) {
		return chatSessionRepository.findByUserEmailAndSessionStatus(userEmail, "IN_PROGRESS")
			.map(this::mapToSessionHistory);
	}

	// ====== private helpers ======

	private ChatSessionEntity createChatSessionEntity(SessionRequest request) {
		ChatSessionEntity entity = new ChatSessionEntity();
		entity.setUserEmail(request.getUserEmail());
		entity.setUserChatSummary(request.getUserChatSummary());
		entity.setUserEmotionAnalysis(request.getUserEmotionAnalysis());
		entity.setAiResponseSummary(request.getAiResponseSummary());
		entity.setSessionStatus(request.getSessionStatus());
		entity.setConversationScore(request.getConversationScore());
		return entity;
	}

	private SessionHistory mapToSessionHistory(ChatSessionEntity entity) {
		return new SessionHistory(
			entity.getSessionId(),
			entity.getUserEmail(),
			entity.getUserChatSummary(),
			entity.getUserEmotionAnalysis(),
			entity.getAiResponseSummary(),
			entity.getSessionStatus(),
			entity.getConversationScore(),
			entity.getCreatedAt(),
			entity.getUpdatedAt()
		);
	}
}
