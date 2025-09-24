package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.ChatMessageEntity;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Long> {

    List<ChatMessageEntity> findBySessionIdOrderByCreatedAtAsc(String sessionId);

    List<ChatMessageEntity> findAllBySessionId(String sessionId);

    long countBySessionId(String sessionId);

    List<ChatMessageEntity> findBySessionIdAndUserEmailOrderByCreatedAtAsc(String sessionId, String userEmail);

    void deleteAllBySessionId(String sessionId);
}
