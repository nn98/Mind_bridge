package com.example.backend.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.common.error.NotFoundException;
import com.example.backend.common.error.ForbiddenException;
import com.example.backend.dto.chat.ChatMessageDto;
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
 * 통합 채팅 서비스 구현체 (개선된 버전)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMapper chatMapper;

    // === 메시지 관련 (개선된 버전) ===

    /**
     * 메시지 저장 (기존 방식 - Entity 반환)
     */
    @Transactional
    public ChatMessageEntity saveMessage(ChatMessageRequest request) {
        log.debug("메시지 저장 요청 - sessionId: {}, type: {}", request.getSessionId(), request.getMessageType());

        ChatMessageEntity entity = chatMapper.toEntity(request);
        ChatMessageEntity saved = chatMessageRepository.save(entity);

        log.info("메시지 저장 완료 - messageId: {}, sessionId: {}", saved.getMessageId(), saved.getSessionId());
        return saved;
    }

    /**
     * 메시지 저장 (새 방식 - DTO 반환)
     */
    @Transactional
    public ChatMessageDto saveMessageDto(ChatMessageRequest request) {
        ChatMessageEntity saved = saveMessage(request);
        return chatMapper.toMessageDto(saved);
    }

    /**
     * 사용자 메시지 저장 (간편 메서드)
     */
    @Transactional
    public ChatMessageDto saveUserMessage(String sessionId, String content, String userEmail, String chatStyle) {
        log.debug("사용자 메시지 저장 - sessionId: {}, userEmail: {}", sessionId, userEmail);

        // 세션 접근 권한 확인
        validateSessionAccess(sessionId, userEmail);

        ChatMessageEntity entity = chatMapper.createUserMessage(sessionId, content, userEmail, chatStyle);
        ChatMessageEntity saved = chatMessageRepository.save(entity);

        log.info("사용자 메시지 저장 완료 - messageId: {}", saved.getMessageId());
        return chatMapper.toMessageDto(saved);
    }

    /**
     * AI 응답 메시지 저장 (간편 메서드)
     */
    @Transactional
    public ChatMessageDto saveAiMessage(String sessionId, String content, String emotionJson,
        String userEmail, String chatStyle) {
        log.debug("AI 메시지 저장 - sessionId: {}, userEmail: {}", sessionId, userEmail);

        // 세션 접근 권한 확인
        validateSessionAccess(sessionId, userEmail);

        ChatMessageEntity entity = chatMapper.createAiMessage(sessionId, content, emotionJson, userEmail, chatStyle);
        ChatMessageEntity saved = chatMessageRepository.save(entity);

        log.info("AI 메시지 저장 완료 - messageId: {}", saved.getMessageId());
        return chatMapper.toMessageDto(saved);
    }

    // === 세션 관련 (개선된 버전) ===

    /**
     * 세션 저장 (기존 방식 - Entity 반환)
     */
    @Transactional
    public ChatSessionEntity saveSession(SessionRequest request) {
        log.debug("세션 저장 요청 - sessionId: {}, userEmail: {}", request.getSessionId(), request.getUserEmail());

        ChatSessionEntity entity = chatMapper.toEntity(request);
        ChatSessionEntity saved = chatSessionRepository.save(entity);

        log.info("세션 저장 완료 - sessionId: {}, userEmail: {}", saved.getSessionId(), saved.getUserEmail());
        return saved;
    }

    /**
     * 세션 저장 (새 방식 - DTO 반환)
     */
    @Transactional
    public ChatSessionDto saveSessionDto(SessionRequest request) {
        ChatSessionEntity saved = saveSession(request);
        return chatMapper.toDto(saved);
    }

    /**
     * 분석 결과 저장 (기존 방식 - Entity 반환)
     */
    @Transactional
    public ChatSessionEntity saveAnalysis(Map<String, Object> payload) {
        log.debug("분석 결과 저장 - payload: {}", payload.keySet());

        ChatSessionEntity entity = chatMapper.toAnalysisEntity(payload);
        ChatSessionEntity saved = chatSessionRepository.save(entity);

        log.info("분석 결과 저장 완료 - sessionId: {}, userEmail: {}", saved.getSessionId(), saved.getUserEmail());
        return saved;
    }

    /**
     * 분석 결과 저장 (새 방식 - DTO 반환)
     */
    @Transactional
    public ChatSessionDto saveAnalysisDto(Map<String, Object> payload) {
        ChatSessionEntity saved = saveAnalysis(payload);
        return chatMapper.toDto(saved);
    }

    /**
     * 세션 업데이트 (기존 방식 - Entity 반환)
     */
    @Transactional
    public ChatSessionEntity updateSession(String sessionId, SessionRequest request) {
        log.debug("세션 업데이트 - sessionId: {}", sessionId);

        ChatSessionEntity entity = chatSessionRepository.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("세션을 찾을 수 없습니다: " + sessionId));

        // 권한 확인 (요청자와 세션 소유자가 같은지)
        if (request.getUserEmail() != null && !entity.getUserEmail().equals(request.getUserEmail())) {
            throw new ForbiddenException("세션 수정 권한이 없습니다.");
        }

        chatMapper.updateEntity(entity, request);
        ChatSessionEntity updated = chatSessionRepository.save(entity);

        log.info("세션 업데이트 완료 - sessionId: {}", updated.getSessionId());
        return updated;
    }

    /**
     * 세션 업데이트 (새 방식 - DTO 반환)
     */
    @Transactional
    public ChatSessionDto updateSessionDto(String sessionId, SessionRequest request) {
        ChatSessionEntity updated = updateSession(sessionId, request);
        return chatMapper.toDto(updated);
    }

    /**
     * 분석 결과로 기존 세션 업데이트
     */
    @Transactional
    public ChatSessionDto updateSessionWithAnalysis(String sessionId, Map<String, Object> analysisPayload, String userEmail) {
        log.debug("세션 분석 결과 업데이트 - sessionId: {}, userEmail: {}", sessionId, userEmail);

        ChatSessionEntity entity = chatSessionRepository.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("세션을 찾을 수 없습니다: " + sessionId));

        // 권한 확인
        if (!entity.getUserEmail().equals(userEmail)) {
            throw new ForbiddenException("세션 접근 권한이 없습니다.");
        }

        // 분석 결과를 기존 엔티티에 병합
        ChatSessionEntity analysisEntity = chatMapper.toAnalysisEntity(analysisPayload);
        mergeAnalysisResult(entity, analysisEntity);

        ChatSessionEntity updated = chatSessionRepository.save(entity);

        log.info("세션 분석 결과 업데이트 완료 - sessionId: {}", sessionId);
        return chatMapper.toDto(updated);
    }

    // === 조회 관련 (개선된 버전) ===

    /**
     * 이메일과 이름으로 세션 조회 (기존 방식 - Entity 반환)
     */
    @Transactional(readOnly = true)
    public List<ChatSessionEntity> getSessionsByEmailAndName(String userEmail, String userName) {
        log.debug("세션 조회 - userEmail: {}, userName: {}", userEmail, userName);

        List<ChatSessionEntity> sessions = chatSessionRepository
            .findAllByUserEmailAndUserNameOrderBySessionIdDesc(userEmail, userName);

        log.info("세션 {} 건 조회 완료", sessions.size());
        return sessions;
    }

    /**
     * 이메일과 이름으로 세션 조회 (새 방식 - DTO 반환)
     */
    @Transactional(readOnly = true)
    public List<ChatSessionDto> getSessionsByEmailAndNameDto(String userEmail, String userName) {
        List<ChatSessionEntity> entities = getSessionsByEmailAndName(userEmail, userName);
        return chatMapper.toSessionDtoList(entities);
    }

    /**
     * 세션 ID로 세션 조회 (기존 방식 - Optional<Entity> 반환)
     */
    @Transactional(readOnly = true)
    public Optional<ChatSessionEntity> getSessionById(String sessionId) {
        log.debug("세션 조회 - sessionId: {}", sessionId);
        return chatSessionRepository.findById(sessionId);
    }

    /**
     * 세션 ID로 세션 조회 (새 방식 - DTO 반환, 권한 확인)
     */
    @Transactional(readOnly = true)
    public ChatSessionDto getSessionByIdDto(String sessionId, String userEmail) {
        log.debug("세션 상세 조회 - sessionId: {}, userEmail: {}", sessionId, userEmail);

        ChatSessionEntity entity = chatSessionRepository.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("세션을 찾을 수 없습니다: " + sessionId));

        // 권한 확인
        if (!entity.getUserEmail().equals(userEmail)) {
            throw new ForbiddenException("세션 접근 권한이 없습니다.");
        }

        return chatMapper.toDto(entity);
    }

    /**
     * 세션의 메시지 조회 (기존 방식 - Entity 리스트 반환)
     */
    @Transactional(readOnly = true)
    public List<ChatMessageEntity> getMessagesBySessionId(String sessionId) {
        log.debug("메시지 조회 - sessionId: {}", sessionId);

        List<ChatMessageEntity> messages = chatMessageRepository.findAllBySessionId(sessionId);

        log.info("메시지 {} 건 조회 완료", messages.size());
        return messages;
    }

    /**
     * 세션의 메시지 조회 (새 방식 - DTO 리스트 반환, 권한 확인)
     */
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessagesBySessionId(String sessionId, String userEmail) {
        log.debug("메시지 조회 - sessionId: {}, userEmail: {}", sessionId, userEmail);

        // 세션 접근 권한 확인
        validateSessionAccess(sessionId, userEmail);

        List<ChatMessageEntity> entities = chatMessageRepository
            .findBySessionIdAndUserEmailOrderByCreatedAtAsc(sessionId, userEmail);

        List<ChatMessageDto> messages = chatMapper.toMessageDtoList(entities);
        log.info("메시지 {} 건 조회 완료", messages.size());

        return messages;
    }

    // === 상태 관련 (기존 방식 유지 및 개선) ===

    /**
     * 사용자 이메일로 세션 조회 (DTO 반환 - 기존 방식 개선)
     */
    @Transactional(readOnly = true)
    public List<ChatSessionDto> getChatSessionsByUserEmail(String userEmail) {
        log.debug("사용자 세션 조회 - userEmail: {}", userEmail);

        List<ChatSessionEntity> entities = chatSessionRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        List<ChatSessionDto> sessions = entities.stream()
            .map(chatMapper::toDto)
            .toList();

        log.info("사용자 세션 {} 건 조회 완료", sessions.size());
        return sessions;
    }

    /**
     * 사용자의 최근 세션 조회 (지정된 개수만큼)
     */
    @Transactional(readOnly = true)
    public List<ChatSessionDto> getRecentChatSessions(String userEmail, int limit) {
        log.debug("최근 세션 조회 - userEmail: {}, limit: {}", userEmail, limit);

        List<ChatSessionEntity> entities = chatSessionRepository
            .findByUserEmailOrderByCreatedAtDesc(userEmail)
            .stream()
            .limit(limit)
            .toList();

        List<ChatSessionDto> sessions = chatMapper.toSessionDtoList(entities);
        log.info("최근 세션 {} 건 조회 완료", sessions.size());

        return sessions;
    }

    // === 헬퍼 메서드들 ===

    /**
     * 세션 접근 권한 확인
     */
    private void validateSessionAccess(String sessionId, String userEmail) {
        boolean exists = chatSessionRepository.existsBySessionIdAndUserEmail(sessionId, userEmail);
        if (!exists) {
            throw new ForbiddenException("세션 접근 권한이 없습니다.");
        }
    }

    /**
     * 분석 결과를 기존 세션에 병합
     */
    private void mergeAnalysisResult(ChatSessionEntity target, ChatSessionEntity source) {
        if (source.getUserName() != null && !source.getUserName().trim().isEmpty()) {
            target.setUserName(source.getUserName());
        }
        if (source.getSummary() != null && !source.getSummary().trim().isEmpty()) {
            target.setSummary(source.getSummary());
        }
        if (source.getEmotions() != null && !source.getEmotions().trim().isEmpty()) {
            target.setEmotions(source.getEmotions());
        }
        if (source.getPrimaryRisk() != null && !source.getPrimaryRisk().trim().isEmpty()) {
            target.setPrimaryRisk(source.getPrimaryRisk());
        }
        if (source.getRiskFactors() != null && !source.getRiskFactors().trim().isEmpty()) {
            target.setRiskFactors(source.getRiskFactors());
        }
        if (source.getProtectiveFactors() != null && !source.getProtectiveFactors().trim().isEmpty()) {
            target.setProtectiveFactors(source.getProtectiveFactors());
        }
    }

    // === 호환성 메서드들 (기존 코드와의 호환성 유지) ===

    /**
     * @deprecated 기존 메서드명과 호환성을 위해 유지
     */
    @Deprecated
    @Transactional(readOnly = true)
    public List<ChatSessionDto> getUserSessions(String userEmail) {
        return getChatSessionsByUserEmail(userEmail);
    }
}
