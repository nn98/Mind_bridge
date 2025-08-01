package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.backend.entity.Post;

public interface PostRepository extends JpaRepository<Post, Long> {
  // 필요시 추가 쿼리 메서드 작성
}
