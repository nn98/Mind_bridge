package com.example.backend.repository;

import com.example.backend.entity.PostEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<PostEntity, Long> {

    @EntityGraph(attributePaths = {"user"})
    List<PostEntity> findAll();

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
