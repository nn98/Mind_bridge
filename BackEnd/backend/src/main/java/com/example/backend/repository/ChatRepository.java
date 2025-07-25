package com.example.backend.repository;

import com.example.backend.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRepository extends JpaRepository<Chat, String> {
    // 이메일 기반 조회가 기본이므로 JpaRepository 기본 메서드 활용 가능
}
