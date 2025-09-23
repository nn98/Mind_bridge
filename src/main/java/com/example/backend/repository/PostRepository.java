package com.example.backend.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.PostEntity;

@Repository
public interface PostRepository extends JpaRepository<PostEntity, Long>, JpaSpecificationExecutor<PostEntity> {

    // ================== 기본 조회 메서드들 (변경 없음) ==================

    List<PostEntity> findAllByOrderByCreatedAtDesc();
    List<PostEntity> findByVisibilityOrderByCreatedAtDesc(String visibility);
    List<PostEntity> findByVisibility(String visibility);
    List<PostEntity> findByStatusOrderByCreatedAtDesc(String status);
    List<PostEntity> findByVisibilityAndStatusOrderByCreatedAtDesc(String visibility, String status);

    // ================== ❌ 제거: userEmail 기반 메서드들 ==================

    // List<PostEntity> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    // List<PostEntity> findByUserEmail(String userEmail);
    // List<PostEntity> findByUserEmailAndStatusOrderByCreatedAtDesc(String userEmail, String status);
    // long countByUserEmailAndVisibility(String userEmail, String visibility);
    // long countByUserEmailAndVisibilityAndStatus(String userEmail, String visibility, String status);

    // ================== ✅ 추가: userId 기반 메서드들 ==================

    /**
     * 사용자 ID로 게시글 조회 (최신순)
     */
    List<PostEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 사용자 ID로 게시글 조회
     */
    List<PostEntity> findByUserId(Long userId);

    /**
     * 사용자 ID와 상태별 게시글 조회 (최신순)
     */
    List<PostEntity> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    /**
     * 사용자 ID와 공개설정별 게시글 개수 조회
     */
    long countByUserIdAndVisibility(Long userId, String visibility);

    /**
     * 사용자 ID, 공개설정, 상태별 게시글 개수 조회
     */
    long countByUserIdAndVisibilityAndStatus(Long userId, String visibility, String status);

    // ================== 네이티브 쿼리 및 기타 메서드들 (변경 없음) ==================

    @Query(value = "SELECT * FROM posts WHERE status = 'active' ORDER BY created_at DESC LIMIT :limit", nativeQuery = true)
    List<PostEntity> findTopNByOrderByCreatedAtDesc(@Param("limit") int limit);

    @Modifying
    @Query("UPDATE PostEntity p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE PostEntity p SET p.likeCount = p.likeCount + :delta WHERE p.id = :id")
    void updateLikeCount(@Param("id") Long id, @Param("delta") int delta);

    @Modifying
    @Query("UPDATE PostEntity p SET p.commentCount = p.commentCount + :delta WHERE p.id = :id")
    void updateCommentCount(@Param("id") Long id, @Param("delta") int delta);

    @Query("SELECT p FROM PostEntity p WHERE p.status = 'active' AND p.visibility = 'public' ORDER BY p.likeCount DESC, p.createdAt DESC")
    Page<PostEntity> findPopularPosts(Pageable pageable);
}
