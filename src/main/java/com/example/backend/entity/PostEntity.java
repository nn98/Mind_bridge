package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 게시글 정보를 담는 엔티티 클래스
 * 사용자가 작성한 게시글의 내용과 메타데이터를 저장
 */
@Entity
@Table(name = "posts",
        indexes = {
                @Index(name = "idx_user_email", columnList = "user_email"),
                @Index(name = "idx_visibility", columnList = "visibility"),
                @Index(name = "idx_created_at", columnList = "created_at"),
                @Index(name = "idx_user_email_visibility", columnList = "user_email, visibility")
        })
@Getter @Setter @NoArgsConstructor
public class PostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 게시글 내용
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    /**
     * 게시글 생성 시간 - 자동으로 현재 시간이 설정됨
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 게시글 수정 시간 - 업데이트 시마다 자동으로 현재 시간이 설정됨
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 작성자 이메일
     */
    @Column(name = "user_email", nullable = false, length = 255)
    private String userEmail;

    /**
     * 작성자 닉네임 (성능 최적화를 위한 비정규화)
     */
    @Column(name = "user_nickname", nullable = false, length = 50)
    private String userNickname;

    /**
     * 공개 설정 (public, private, friends)
     */
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'public'")
    private String visibility = "public";

    /**
     * 좋아요 수 (성능 최적화를 위한 비정규화)
     */
    @Column(name = "like_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer likeCount = 0;

    /**
     * 댓글 수 (성능 최적화를 위한 비정규화)
     */
    @Column(name = "comment_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer commentCount = 0;

    /**
     * 조회수
     */
    @Column(name = "view_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer viewCount = 0;

    /**
     * 게시글 상태 (active, deleted, hidden)
     */
    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'active'")
    private String status = "active";

    /**
     * 작성자 정보 (연관관계 매핑)
     * LAZY 로딩으로 성능 최적화
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_email", referencedColumnName = "email", insertable = false, updatable = false)
    private UserEntity user;

    // === 비즈니스 메서드 ===

    /**
     * 좋아요 수 증가
     */
    public void incrementLikeCount() {
        this.likeCount = (this.likeCount == null ? 0 : this.likeCount) + 1;
    }

    /**
     * 좋아요 수 감소
     */
    public void decrementLikeCount() {
        this.likeCount = Math.max(0, (this.likeCount == null ? 0 : this.likeCount) - 1);
    }

    /**
     * 댓글 수 증가
     */
    public void incrementCommentCount() {
        this.commentCount = (this.commentCount == null ? 0 : this.commentCount) + 1;
    }

    /**
     * 댓글 수 감소
     */
    public void decrementCommentCount() {
        this.commentCount = Math.max(0, (this.commentCount == null ? 0 : this.commentCount) - 1);
    }

    /**
     * 조회수 증가
     */
    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
    }

    /**
     * 공개 게시글인지 확인
     */
    public boolean isPublic() {
        return "public".equals(this.visibility);
    }

    /**
     * 비공개 게시글인지 확인
     */
    public boolean isPrivate() {
        return "private".equals(this.visibility);
    }

    /**
     * 친구 공개 게시글인지 확인
     */
    public boolean isFriendsOnly() {
        return "friends".equals(this.visibility);
    }

    /**
     * 활성 상태인지 확인
     */
    public boolean isActive() {
        return "active".equals(this.status);
    }

    /**
     * 삭제된 상태인지 확인
     */
    public boolean isDeleted() {
        return "deleted".equals(this.status);
    }

    /**
     * 게시글을 소프트 삭제
     */
    public void softDelete() {
        this.status = "deleted";
    }

    /**
     * 게시글을 숨김 처리
     */
    public void hide() {
        this.status = "hidden";
    }

    /**
     * 게시글을 활성화
     */
    public void activate() {
        this.status = "active";
    }
}
