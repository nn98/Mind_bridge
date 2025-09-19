package com.example.backend.service.impl;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.dto.chat.SessionHistory;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;
import com.example.backend.mapper.ChatMapper;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.repository.ChatSessionRepository;
import com.example.backend.service.ChatService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 통합 채팅 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChatServiceImpl implements ChatService {

	private final ChatMessageRepository chatMessageRepository;
	private final ChatSessionRepository chatSessionRepository;
	private final ChatMapper chatMapper;

	// === 메시지 관련 ===

	@Override
	public ChatMessageEntity saveMessage(ChatMessageRequest request) {
		ChatMessageEntity entity = chatMapper.toEntity(request);
		ChatMessageEntity saved = chatMessageRepository.save(entity);
		log.debug("Saved chat message ID: {} for session: {}", saved.getMessageId(), saved.getSessionId());
		return saved;
	}

	// === 세션 관련 ===

	@Override
	public ChatSessionEntity saveSession(SessionRequest request) {
		ChatSessionEntity entity = chatMapper.toEntity(request);
		ChatSessionEntity saved = chatSessionRepository.save(entity);
		log.info("Saved chat session ID: {} for user: {}", saved.getSessionId(), saved.getUserEmail());
		return saved;
	}

	@Override
	public ChatSessionEntity saveAnalysis(Map<String, Object> payload) {
		ChatSessionEntity entity = chatMapper.toAnalysisEntity(payload);
		ChatSessionEntity saved = chatSessionRepository.save(entity);
		log.info("Saved analysis session ID: {} for user: {}", saved.getSessionId(), saved.getUserEmail());
		return saved;
	}

	@Override
	public ChatSessionEntity updateSession(Long sessionId, SessionRequest request) {
		ChatSessionEntity entity = chatSessionRepository.findById(sessionId)
			.orElseThrow(() -> new NotFoundException("Session not found with ID: " + sessionId));

		chatMapper.updateEntity(entity, request);
		ChatSessionEntity updated = chatSessionRepository.save(entity);
		log.info("Updated chat session ID: {}", updated.getSessionId());
		return updated;
	}

	// === 조회 관련 ===

	@Override
	@Transactional(readOnly = true)
	public List<SessionHistory> getAllSessions() {
		return chatSessionRepository.findAll()
			.stream()
			.map(chatMapper::toSessionHistory)
			.collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public List<SessionHistory> getSessionsByUserEmail(String userEmail) {
		return chatSessionRepository.findByUserEmailOrderByCreatedAtDesc(userEmail)
			.stream()
			.map(chatMapper::toSessionHistory)
			.collect(Collectors.toList());
	}

	@Override
	@Transactional(readOnly = true)
	public List<ChatSessionEntity> getSessionsByEmailAndName(String userEmail, String userName) {
		return chatSessionRepository.findAllByUserEmailAndUserNameOrderBySessionIdDesc(userEmail, userName);
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<ChatSessionEntity> getSessionById(Long sessionId) {
		return chatSessionRepository.findById(sessionId);
	}

	// === 상태 관련 ===

	@Override
	@Transactional(readOnly = true)
	public long getCompletedSessionCount(String userEmail) {
		return chatSessionRepository.countByUserEmailAndSessionStatus(userEmail, "COMPLETED");
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<SessionHistory> getActiveSession(String userEmail) {
		return chatSessionRepository.findByUserEmailAndSessionStatus(userEmail, "IN_PROGRESS")
			.map(chatMapper::toSessionHistory);
	}
}
