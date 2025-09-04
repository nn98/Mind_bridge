// src/test/java/com/example/backend/repository/PostRepositoryTest.java
package com.example.backend.repository;

import com.example.backend.domain.post.PostRepository;
import com.example.backend.infrastructure.persistence.entity.PostEntity;
import com.example.backend.infrastructure.persistence.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PostRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PostRepository postRepository;

    @Test
    @DisplayName("모든 게시글 조회 - 최신순")
    void testFindAllByOrderByCreatedAtDesc() {
        // Given - 먼저 User 생성
        UserEntity user = createTestUser("test@example.com", "testuser");
        entityManager.persistAndFlush(user);

        PostEntity post1 = createTestPost("첫 번째 게시글", user.getEmail(), "public");
        PostEntity post2 = createTestPost("두 번째 게시글", user.getEmail(), "public");

        entityManager.persistAndFlush(post1);
        entityManager.persistAndFlush(post2);

        // When
        List<PostEntity> posts = postRepository.findAllByOrderByCreatedAtDesc();

        // Then
        assertThat(posts).hasSize(2);
    }

    @Test
    @DisplayName("공개 설정별 게시글 조회")
    void testFindByVisibilityOrderByCreatedAtDesc() {
        // Given - 먼저 User 생성
        UserEntity user = createTestUser("test@example.com", "testuser");
        entityManager.persistAndFlush(user);

        PostEntity publicPost = createTestPost("공개 게시글", user.getEmail(), "public");
        PostEntity privatePost = createTestPost("비공개 게시글", user.getEmail(), "private");

        entityManager.persistAndFlush(publicPost);
        entityManager.persistAndFlush(privatePost);

        // When
        List<PostEntity> publicPosts = postRepository.findByVisibilityOrderByCreatedAtDesc("public");

        // Then
        assertThat(publicPosts).hasSize(1);
        assertThat(publicPosts.get(0).getContent()).isEqualTo("공개 게시글");
    }

    @Test
    @DisplayName("사용자별 공개 설정별 게시글 수 조회")
    void testCountByUserEmailAndVisibility() {
        // Given - 먼저 User 생성
        UserEntity user = createTestUser("test@example.com", "testuser");
        entityManager.persistAndFlush(user);

        String userEmail = user.getEmail();

        PostEntity publicPost1 = createTestPost("공개 게시글1", userEmail, "public");
        PostEntity publicPost2 = createTestPost("공개 게시글2", userEmail, "public");
        PostEntity privatePost = createTestPost("비공개 게시글", userEmail, "private");

        entityManager.persistAndFlush(publicPost1);
        entityManager.persistAndFlush(publicPost2);
        entityManager.persistAndFlush(privatePost);

        // When
        long publicCount = postRepository.countByUserEmailAndVisibility(userEmail, "public");
        long privateCount = postRepository.countByUserEmailAndVisibility(userEmail, "private");

        // Then
        assertThat(publicCount).isEqualTo(2);
        assertThat(privateCount).isEqualTo(1);
    }

    // Helper 메서드들
    private UserEntity createTestUser(String email, String nickname) {
        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setNickname(nickname);
        user.setPassword("password");
        user.setRole("USER");
        user.setAge(25);
        user.setGender("M");
        return user;
    }

    private PostEntity createTestPost(String content, String userEmail, String visibility) {
        PostEntity post = new PostEntity();
        post.setContent(content);
        post.setUserEmail(userEmail);
        post.setUserNickname("testuser");
        post.setVisibility(visibility);
        post.setStatus("active");
        post.setLikeCount(0);
        post.setCommentCount(0);
        post.setViewCount(0);
        return post;
    }
}
