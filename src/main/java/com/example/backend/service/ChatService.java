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

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMapper chatMapper;

    // ================== 메시지 관련 ==================

    /**
     * 메시지 저장 (FastAPI용 - Entity 반환)
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
     * 세션의 메시지 조회 (테스트용 - 기존 호환성)
     * @deprecated 새 API는 getMessagesBySessionId(String, String) 사용 권장
     */
    @Deprecated
    @Transactional(readOnly = true)
    public List<ChatMessageEntity> getMessagesBySessionId(String sessionId) {
        log.debug("메시지 조회 - sessionId: {}", sessionId);
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    /**
     * 세션의 메시지 조회 (권한 확인)
     */
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessagesBySessionId(String sessionId, String userEmail) {
        log.debug("메시지 조회 - sessionId: {}, userEmail: {}", sessionId, userEmail);

        validateSessionAccess(sessionId, userEmail);

        List<ChatMessageEntity> entities = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        List<ChatMessageDto> messages = chatMapper.toMessageDtoList(entities);

        log.info("메시지 {} 건 조회 완료", messages.size());
        return messages;
    }

    // ================== 세션 관련 ==================

    /**
     * 세션 저장 (FastAPI용 - Entity 반환)
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
     * 분석 결과 저장 (테스트용 - 기존 호환성)
     * @deprecated 새 API는 saveAnalysisDto 사용 권장
     */
    @Deprecated
    @Transactional
    public ChatSessionEntity saveAnalysis(Map<String, Object> payload) {
        log.debug("분석 결과 저장 - payload: {}", payload.keySet());

        ChatSessionEntity entity = chatMapper.toAnalysisEntity(payload);
        ChatSessionEntity saved = chatSessionRepository.save(entity);

        log.info("분석 결과 저장 완료 - sessionId: {}, userEmail: {}", saved.getSessionId(), saved.getUserEmail());
        return saved;
    }

    /**
     * 세션 업데이트 (테스트용 - 기존 호환성)
     * @deprecated 새 API는 updateSessionDto 사용 권장
     */
    @Deprecated
    @Transactional
    public ChatSessionEntity updateSession(String sessionId, SessionRequest request) {
        log.debug("세션 업데이트 - sessionId: {}", sessionId);

        ChatSessionEntity entity = chatSessionRepository.findBySessionId(sessionId)
            .orElseThrow(() -> new NotFoundException("세션을 찾을 수 없습니다: " + sessionId));

        if (request.getUserEmail() != null && !entity.getUserEmail().equals(request.getUserEmail())) {
            throw new ForbiddenException("세션 수정 권한이 없습니다.");
        }

        chatMapper.updateEntity(entity, request);
        ChatSessionEntity updated = chatSessionRepository.save(entity);

        log.info("세션 업데이트 완료 - sessionId: {}", updated.getSessionId());
        return updated;
    }

    /**
     * 세션 ID로 세션 조회 (테스트용 - Entity 반환)
     * @deprecated 새 API는 getSessionById(String) 사용 권장 (DTO 반환)
     */
    @Deprecated
    @Transactional(readOnly = true)
    public Optional<ChatSessionEntity> getSessionByIdEntity(String sessionId) {
        log.debug("세션 조회 (Entity) - sessionId: {}", sessionId);
        return chatSessionRepository.findBySessionId(sessionId);
    }

    /**
     * 세션 ID로 세션 조회 (DTO 반환)
     */
    @Transactional(readOnly = true)
    public Optional<ChatSessionDto> getSessionById(String sessionId) {
        log.debug("세션 조회 - sessionId: {}", sessionId);

        return chatSessionRepository.findBySessionId(sessionId)
            .map(chatMapper::toDto);
    }

    /**
     * 이메일과 이름으로 세션 조회 (FastAPI용 - Entity 반환)
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
     * 사용자 이메일로 세션 조회 (DTO 반환)
     */
    @Transactional(readOnly = true)
    public List<ChatSessionDto> getChatSessionsByUserEmail(String userEmail) {
        log.debug("사용자 세션 조회 - userEmail: {}", userEmail);

        List<ChatSessionEntity> entities = chatSessionRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        List<ChatSessionDto> sessions = chatMapper.toSessionDtoList(entities);

        log.info("사용자 세션 {} 건 조회 완료", sessions.size());
        return sessions;
    }

    // ================== 삭제 관련 ==================

    /**
     * 세션 삭제
     */
    @Transactional
    public void deleteSession(String sessionId) {
        log.debug("세션 삭제 - sessionId: {}", sessionId);

        ChatSessionEntity entity = chatSessionRepository.findBySessionId(sessionId)
            .orElseThrow(() -> new NotFoundException("세션을 찾을 수 없습니다: " + sessionId));

        chatMessageRepository.deleteAllBySessionId(sessionId);
        chatSessionRepository.delete(entity);

        log.info("세션 삭제 완료 - sessionId: {}", sessionId);
    }

    // ================== 헬퍼 메서드 ==================

    /**
     * 세션 접근 권한 확인
     */
    private void validateSessionAccess(String sessionId, String userEmail) {
        boolean exists = chatSessionRepository.existsBySessionIdAndUserEmail(sessionId, userEmail);
        if (!exists) {
            throw new ForbiddenException("세션 접근 권한이 없습니다.");
        }
    }
}
