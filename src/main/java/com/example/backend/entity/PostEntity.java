package com.example.backend.entity;

import static com.example.backend.common.constant.PostConstants.Visibility.*;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
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
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    // ✅ 테이블 컬럼명과 정확히 일치하는 직접 매핑
    @Column(name = "user_email", nullable = false, length = 255)
    private String userEmail;

    @Column(name = "user_nickname", nullable = false, length = 50)
    private String userNickname;

    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'public'")
    @Builder.Default
    private String visibility = PUBLIC;

    @Column(name = "like_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    @Builder.Default
    private Integer likeCount = 0;

    @Column(name = "comment_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    @Builder.Default
    private Integer commentCount = 0;

    @Column(name = "view_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'active'")
    @Builder.Default
    private String status = "active";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ✅ author 연관관계 제거! userEmail, userNickname 직접 사용

    // 비즈니스 메서드들은 유지
    public void incrementLikeCount() {
        this.likeCount = (this.likeCount == null ? 0 : this.likeCount) + 1;
    }

    public void decrementLikeCount() {
        this.likeCount = Math.max(0, (this.likeCount == null ? 0 : this.likeCount) - 1);
    }

    public boolean isPublic() {
        return PUBLIC.equals(this.visibility);
    }

    public boolean isActive() {
        return "active".equals(this.status);
    }
}
