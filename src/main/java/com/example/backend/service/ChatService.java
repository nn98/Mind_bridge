package com.example.backend.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.dto.chat.ChatSessionDto;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;
import com.example.backend.mapper.ChatMapper;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.repository.ChatSessionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 통합 채팅 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMapper chatMapper;

    // === 메시지 관련 ===

    public ChatMessageEntity saveMessage(ChatMessageRequest request) {
        ChatMessageEntity entity = chatMapper.toEntity(request);
        ChatMessageEntity saved = chatMessageRepository.save(entity);
        log.debug("Saved chat message ID: {} for session: {}", saved.getMessageId(), saved.getSessionId());
        return saved;
    }

    // === 세션 관련 ===

    public ChatSessionEntity saveSession(SessionRequest request) {
        ChatSessionEntity entity = chatMapper.toEntity(request);
        log.info("Chat Session Request: {} / entity: {}", request.getSessionId(), entity.getSessionId());
        ChatSessionEntity saved = chatSessionRepository.save(entity);
        log.info("Saved chat session ID: {} \n\tfor user: {}", saved.getSessionId(), saved);
        return saved;
    }

    public ChatSessionEntity saveAnalysis(Map<String, Object> payload) {
        ChatSessionEntity entity = chatMapper.toAnalysisEntity(payload);
        ChatSessionEntity saved = chatSessionRepository.save(entity);
        log.info("Saved analysis session ID: {} for user: {}", saved.getSessionId(), saved.getUserEmail());
        return saved;
    }

    public ChatSessionEntity updateSession(String sessionId, SessionRequest request) {
        ChatSessionEntity entity = chatSessionRepository.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("Session not found with ID: " + sessionId));

        chatMapper.updateEntity(entity, request);
        ChatSessionEntity updated = chatSessionRepository.save(entity);
        log.info("Updated chat session ID: {}", updated.getSessionId());
        return updated;
    }

    // === 조회 관련 ===

    @Transactional(readOnly = true)
    public List<ChatSessionEntity> getSessionsByEmailAndName(String userEmail, String userName) {
        return chatSessionRepository.findAllByUserEmailAndUserNameOrderBySessionIdDesc(userEmail, userName);
    }

    @Transactional(readOnly = true)
    public Optional<ChatSessionEntity> getSessionById(String sessionId) {
        return chatSessionRepository.findById(sessionId);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageEntity> getMessagesBySessionId(String sessionId) {
        return chatMessageRepository.findAllBySessionId(sessionId);
    }

    // === 상태 관련 ===

    public List<ChatSessionDto> getChatSessionsByUserEmail(String userEmail) {
        var entities = chatSessionRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        return entities.stream()
            .map(chatMapper::toDto)
            .toList();
    }
}
