package com.example.backend.repository;

import com.example.backend.entity.PostEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<PostEntity, Long> {

    /**
     * 전체 게시글 조회 (최신순)
     */
    List<PostEntity> findAllByOrderByCreatedAtDesc();

    /**
     * 공개 설정별 게시글 조회 (최신순)
     */
    List<PostEntity> findByVisibilityOrderByCreatedAtDesc(String visibility);

    /**
     * 공개 설정별 게시글 조회 (기존 호환용)
     */
    List<PostEntity> findByVisibility(String visibility);

    /**
     * 사용자별 게시글 조회 (최신순)
     */
    List<PostEntity> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    /**
     * 사용자별 게시글 조회 (기존 호환용)
     */
    List<PostEntity> findByUserEmail(String userEmail);

    /**
     * 활성 상태 게시글 조회 (최신순)
     */
    List<PostEntity> findByStatusOrderByCreatedAtDesc(String status);

    /**
     * 공개 설정별 활성 게시글 조회 (최신순)
     */
    List<PostEntity> findByVisibilityAndStatusOrderByCreatedAtDesc(String visibility, String status);

    /**
     * 사용자별 활성 게시글 조회 (최신순)
     */
    List<PostEntity> findByUserEmailAndStatusOrderByCreatedAtDesc(String userEmail, String status);

    /**
     * 사용자별 공개 설정별 게시글 수 조회
     */
    long countByUserEmailAndVisibility(String userEmail, String visibility);

    /**
     * 사용자별 공개 설정별 활성 게시글 수 조회
     */
    long countByUserEmailAndVisibilityAndStatus(String userEmail, String visibility, String status);

    /**
     * 최근 N개 게시글 조회 (네이티브 쿼리)
     */
    @Query(value = "SELECT * FROM posts WHERE status = 'active' ORDER BY created_at DESC LIMIT :limit", nativeQuery = true)
    List<PostEntity> findTopNByOrderByCreatedAtDesc(@Param("limit") int limit);

    /**
     * 조회수 증가
     */
    @Modifying
    @Query("UPDATE PostEntity p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") Long id);

    /**
     * 좋아요 수 업데이트
     */
    @Modifying
    @Query("UPDATE PostEntity p SET p.likeCount = p.likeCount + :delta WHERE p.id = :id")
    void updateLikeCount(@Param("id") Long id, @Param("delta") int delta);

    /**
     * 댓글 수 업데이트
     */
    @Modifying
    @Query("UPDATE PostEntity p SET p.commentCount = p.commentCount + :delta WHERE p.id = :id")
    void updateCommentCount(@Param("id") Long id, @Param("delta") int delta);

    /**
     * 인기 게시글 조회 (좋아요 수 기준)
     */
    @Query("SELECT p FROM PostEntity p WHERE p.status = 'active' AND p.visibility = 'public' ORDER BY p.likeCount DESC, p.createdAt DESC")
    Page<PostEntity> findPopularPosts(Pageable pageable);
}
