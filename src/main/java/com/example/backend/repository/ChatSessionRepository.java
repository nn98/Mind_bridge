package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.dto.chat.RiskAssessment;
import com.example.backend.entity.ChatSessionEntity;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSessionEntity, String> {  // ❌ Long → ✅ String
    Optional<ChatSessionEntity> findBySessionId(String sessionId);  // ❌ findById → ✅ findBySessionId
    List<ChatSessionEntity> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    List<ChatSessionEntity> findAllByUserEmailAndUserNameOrderBySessionIdDesc(String userEmail, String userName);

    @Query("SELECT new com.example.backend.dto.chat.RiskAssessment(c.riskFactors, c.primaryRisk, c.createdAt, c.sessionId, c.userEmail) FROM ChatSessionEntity c WHERE c.userEmail = :userEmail")
    List<RiskAssessment> findRiskAssessmentByUserEmail(@Param("userEmail") String userEmail);
    boolean existsBySessionIdAndUserEmail(String sessionId, String userEmail);
    Optional<ChatSessionEntity> findBySessionIdAndUserEmail(String sessionId, String userEmail);
}
