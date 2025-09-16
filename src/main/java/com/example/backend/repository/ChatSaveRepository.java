package com.example.backend.repository;

import com.example.backend.entity.ChatHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatSaveRepository extends JpaRepository<ChatHistoryEntity, Long> {
}
