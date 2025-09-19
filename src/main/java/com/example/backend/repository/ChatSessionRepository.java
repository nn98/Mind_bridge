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
public interface ChatSessionRepository extends JpaRepository<ChatSessionEntity, Long> {

    Optional<ChatSessionEntity> findById(String id);

    // 특정 사용자의 채팅 세션 목록 조회 (최신순)
    List<ChatSessionEntity> findByUserEmailOrderByCreatedAtDesc(String userEmail);

	List<ChatSessionEntity> findAllByUserEmailAndUserNameOrderBySessionIdDesc(String userEmail, String userName);
    //리스크 펙터/디비전 조회
    List<RiskAssessment> findRiskAssessmentByUserEmail(String userEmail);
}
