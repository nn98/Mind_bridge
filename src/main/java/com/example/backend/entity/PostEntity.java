package com.example.backend.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
     * 게시글 제목 - AdminQueryServiceImpl에서 사용됨
     */
    @Column(nullable = false, length = 200)
    private String title;

    /**
     * 게시글 내용
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "user_email", nullable = false, length = 255)
    private String userEmail;

    @Column(name = "user_nickname", nullable = false, length = 50)
    private String userNickname;

	/**
	 * -- SETTER --
	 *  가시성 설정 메서드 - AdminQueryServiceImpl에서 사용
	 */
	@Setter
	@Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'public'")
    private String visibility = "public";

    @Column(name = "like_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer likeCount = 0;

    @Column(name = "comment_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer commentCount = 0;

    @Column(name = "view_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer viewCount = 0;

    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'active'")
    private String status = "active";

    /**
     * 작성자 정보 - AdminQueryServiceImpl에서 author로 접근
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_email", referencedColumnName = "email", insertable = false, updatable = false)
    private UserEntity author; // user → author로 변경

    // 기존 비즈니스 메서드들...
    public void incrementLikeCount() {
        this.likeCount = (this.likeCount == null ? 0 : this.likeCount) + 1;
    }

    public void decrementLikeCount() {
        this.likeCount = Math.max(0, (this.likeCount == null ? 0 : this.likeCount) - 1);
    }

    public void incrementCommentCount() {
        this.commentCount = (this.commentCount == null ? 0 : this.commentCount) + 1;
    }

    public void decrementCommentCount() {
        this.commentCount = Math.max(0, (this.commentCount == null ? 0 : this.commentCount) - 1);
    }

    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
    }

    public boolean isPublic() {
        return "public".equals(this.visibility);
    }

    public boolean isPrivate() {
        return "private".equals(this.visibility);
    }

    public boolean isFriendsOnly() {
        return "friends".equals(this.visibility);
    }

    public boolean isActive() {
        return "active".equals(this.status);
    }

    public boolean isDeleted() {
        return "deleted".equals(this.status);
    }

    public void softDelete() {
        this.status = "deleted";
    }

    public void hide() {
        this.status = "hidden";
    }

    public void activate() {
        this.status = "active";
    }
}
