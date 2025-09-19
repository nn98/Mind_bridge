package com.example.backend.entity;

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

@Entity
@Table(name = "posts", indexes = {
    @Index(name = "idx_posts_user_email", columnList = "user_email"),
    @Index(name = "idx_posts_created_at", columnList = "created_at"),
    @Index(name = "idx_user_email", columnList = "user_email"),
    @Index(name = "idx_visibility", columnList = "visibility"),
    @Index(name = "idx_created_at", columnList = "created_at"),
    @Index(name = "idx_user_email_visibility", columnList = "user_email, visibility"),
    @Index(name = "fk_posts_user_nickname", columnList = "user_nickname")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")  // ❌ "postid" → ✅ "post_id"
    private Long postId;

    @Column(nullable = true, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "user_email", nullable = false, length = 255)  // ❌ "useremail" → ✅ "user_email"
    private String userEmail;

    @Column(name = "user_nickname", nullable = false, length = 50)  // ❌ "usernickname" → ✅ "user_nickname"
    private String userNickname;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String visibility = "public";

    @Column(name = "comment_count", nullable = false)  // ❌ "commentcount" → ✅ "comment_count"
    @Builder.Default
    private Integer commentCount = 0;

    @Column(name = "like_count", nullable = false)  // ❌ "likecount" → ✅ "like_count"
    @Builder.Default
    private Integer likeCount = 0;

    @Column(name = "view_count", nullable = false)  // ❌ "viewcount" → ✅ "view_count"
    @Builder.Default
    private Integer viewCount = 0;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "active";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)  // ❌ "createdat" → ✅ "created_at"
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)  // ❌ "updatedat" → ✅ "updated_at"
    private LocalDateTime updatedAt;

    public boolean isPublic() {
        return "public".equals(this.visibility);
    }
}
