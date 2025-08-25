package com.example.backend.service;

import com.example.backend.dto.chat.SessionHistory;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.entity.ChatSessionEntity;
import com.example.backend.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 채팅 세션 관리 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatSessionService {

    private final ChatSessionRepository chatSessionRepository;

    /**
     * 채팅 세션 저장
     */
    @Transactional
    public SessionHistory saveSession(SessionRequest request) {
        // 요청 DTO → 엔티티 변환
        ChatSessionEntity entity = createChatSessionEntity(request);

        // 엔티티 저장
        ChatSessionEntity savedEntity = chatSessionRepository.save(entity);

        log.info("새 채팅 세션 저장 완료 - ID: {}, 사용자: {}", savedEntity.getSessionId(), savedEntity.getEmail());

        // 엔티티 → DTO 변환 후 반환
        return mapToSessionHistory(savedEntity);
    }

    /**
     * 이메일 기준 채팅 세션 목록 조회
     */
    @Transactional(readOnly = true)
    public List<SessionHistory> getSessionsByEmail(String email) {
        List<ChatSessionEntity> sessions = chatSessionRepository.findByEmailOrderByCreatedAtDesc(email);

        return sessions.stream()
                .map(this::mapToSessionHistory)
                .collect(Collectors.toList());
    }

    /**
     * 완료된 세션 수 조회
     */
    @Transactional(readOnly = true)
    public long getCompletedSessionCount(String email) {
        return chatSessionRepository.countCompletedSessionsByEmail(email);
    }

    /**
     * 진행 중인 세션 조회
     */
    @Transactional(readOnly = true)
    public Optional<SessionHistory> getActiveSession(String email) {
        return chatSessionRepository.findByEmailAndSessionStatus(email, "IN_PROGRESS")
                .map(this::mapToSessionHistory);
    }

    // === Private Helper Methods ===

    /**
     * 요청 DTO로부터 ChatSessionEntity 생성
     */
    private ChatSessionEntity createChatSessionEntity(SessionRequest request) {
        ChatSessionEntity entity = new ChatSessionEntity();
        entity.setEmail(request.getEmail());
        entity.setUserChatSummary(request.getUserChatSummary());
        entity.setUserEmotionAnalysis(request.getUserEmotionAnalysis());
        entity.setAiResponseSummary(request.getAiResponseSummary());
        entity.setSessionStatus(request.getSessionStatus());
        entity.setConversationScore(request.getConversationScore());
        return entity;
    }

    /**
     * ChatSessionEntity → SessionHistory DTO 변환
     */
    private SessionHistory mapToSessionHistory(ChatSessionEntity entity) {
        return new SessionHistory(
                entity.getSessionId(),  // sessionId로 수정
                entity.getEmail(),
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
