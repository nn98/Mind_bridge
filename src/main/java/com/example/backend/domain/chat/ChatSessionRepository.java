package com.example.backend.domain.chat;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.infrastructure.persistence.entity.ChatSessionEntity;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSessionEntity, Long> {

    // 특정 사용자의 채팅 세션 목록 조회 (최신순)
    List<ChatSessionEntity> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    // 완료된 채팅 세션 수
    @Query("SELECT COUNT(c) FROM ChatSessionEntity c WHERE c.userEmail = :userEmail AND c.sessionStatus = 'COMPLETED'")
    long countCompletedSessionsByUserEmail(@Param("userEmail") String userEmail);

    // 진행 중 세션 조회
    Optional<ChatSessionEntity> findByUserEmailAndSessionStatus(String userEmail, String sessionStatus);

    // 특정 점수 이상의 세션
    List<ChatSessionEntity> findByUserEmailAndConversationScoreGreaterThanEqual(String userEmail, Integer minScore);
}
