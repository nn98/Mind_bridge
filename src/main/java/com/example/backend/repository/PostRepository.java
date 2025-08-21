package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.PostEntity;

@Repository
public interface PostRepository extends JpaRepository<PostEntity, Long> {

    // 사용자 이메일로 게시글 조회
    List<PostEntity> findByUserEmail(String userEmail);

    // 공개 설정으로 게시글 조회
    List<PostEntity> findByVisibility(String visibility);

    // 사용자 이메일과 공개 설정으로 게시글 조회
    List<PostEntity> findByUserEmailAndVisibility(String userEmail, String visibility);

    // 최신 순 정렬로 조회
    List<PostEntity> findAllByOrderByCreatedAtDesc();

    // 특정 사용자의 최신 게시글 조회
    List<PostEntity> findByUserEmailOrderByCreatedAtDesc(String userEmail);
}
