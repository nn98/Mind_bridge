package com.example.backend.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.dto.chat.RiskAssessment;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.dto.chat.SessionHistory;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;

/**
 * 통합 채팅 서비스 인터페이스
 * - 개별 메시지 관리 (기존 ChatHistoryService)
 * - 세션 전체 관리 (기존 ChatSessionService)
 * - 상담 분석 관리 (기존 CounsellingService)
 */
public interface ChatService {

    // === 메시지 관련 ===
    ChatMessageEntity saveMessage(ChatMessageRequest request);

    // === 세션 관련 ===
    ChatSessionEntity saveSession(SessionRequest request);
    ChatSessionEntity saveAnalysis(Map<String, Object> payload);
    ChatSessionEntity updateSession(Long sessionId, SessionRequest request);

    // === 조회 관련 ===
    List<SessionHistory> getAllSessions();
    List<SessionHistory> getSessionsByUserEmail(String userEmail);
    List<ChatSessionEntity> getSessionsByEmailAndName(String userEmail, String userName);
    Optional<ChatSessionEntity> getSessionById(Long sessionId);

    // === 상태 관련 ===
    long getCompletedSessionCount(String userEmail);
    Optional<SessionHistory> getActiveSession(String userEmail);
    List<RiskAssessment> getRiskAssessmentByUserEmail(String userEmail);
}
