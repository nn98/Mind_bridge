package com.example.backend.repository;

import com.example.backend.entity.ChatSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSessionEntity, Long> {

    /**
     * 특정 사용자의 채팅 세션 목록 조회 (최신순)
     */
    List<ChatSessionEntity> findByEmailOrderByCreatedAtDesc(String email);

    /**
     * 특정 사용자의 완료된 채팅 세션 수 조회
     */
    @Query("SELECT COUNT(c) FROM ChatSessionEntity c WHERE c.email = :email AND c.sessionStatus = 'COMPLETED'")
    long countCompletedSessionsByEmail(@Param("email") String email);

    /**
     * 특정 사용자의 진행 중인 채팅 세션 조회
     */
    Optional<ChatSessionEntity> findByEmailAndSessionStatus(String email, String sessionStatus);

    /**
     * 특정 점수 이상의 세션 조회
     */
    List<ChatSessionEntity> findByEmailAndConversationScoreGreaterThanEqual(String email, Integer minScore);
}
