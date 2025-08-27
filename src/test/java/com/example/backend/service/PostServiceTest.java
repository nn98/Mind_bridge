// src/test/java/com/example/backend/service/PostServiceTest.java
package com.example.backend.service;

import com.example.backend.dto.post.CreateRequest;
import com.example.backend.dto.post.Detail;
import com.example.backend.dto.post.Summary;
import com.example.backend.dto.post.UpdateRequest;
import com.example.backend.entity.PostEntity;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PostService postService;

    @Test
    @DisplayName("게시글 작성 성공")
    void testCreatePostSuccess() {
        // Given
        CreateRequest request = new CreateRequest();
        request.setContent("새로운 게시글 내용");
        request.setVisibility("public");

        String userEmail = "test@example.com";

        UserEntity user = new UserEntity();
        user.setEmail(userEmail);
        user.setNickname("testuser");

        PostEntity savedPost = new PostEntity();
        savedPost.setId(1L);
        savedPost.setContent("새로운 게시글 내용");
        savedPost.setVisibility("public");
        savedPost.setUserEmail(userEmail);
        savedPost.setUserNickname("testuser");
        savedPost.setCreatedAt(LocalDateTime.now());

        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(user));
        when(postRepository.save(any(PostEntity.class))).thenReturn(savedPost);

        // When
        Detail result = postService.createPost(request, userEmail);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEqualTo("새로운 게시글 내용");
        assertThat(result.getVisibility()).isEqualTo("public");
        assertThat(result.getUserEmail()).isEqualTo(userEmail);
        assertThat(result.getUserNickname()).isEqualTo("testuser");

        verify(userRepository).findByEmail(userEmail);
        verify(postRepository).save(any(PostEntity.class));
    }

    @Test
    @DisplayName("게시글 수정 성공")
    void testUpdatePostSuccess() {
        // Given
        Long postId = 1L;
        String userEmail = "test@example.com";

        UpdateRequest request = new UpdateRequest();
        request.setContent("수정된 내용");
        request.setVisibility("private");

        PostEntity existingPost = new PostEntity();
        existingPost.setId(postId);
        existingPost.setContent("원래 내용");
        existingPost.setVisibility("public");
        existingPost.setUserEmail(userEmail);

        PostEntity updatedPost = new PostEntity();
        updatedPost.setId(postId);
        updatedPost.setContent("수정된 내용");
        updatedPost.setVisibility("private");
        updatedPost.setUserEmail(userEmail);
        updatedPost.setUpdatedAt(LocalDateTime.now());

        when(postRepository.findById(postId)).thenReturn(Optional.of(existingPost));
        when(postRepository.save(any(PostEntity.class))).thenReturn(updatedPost);

        // When
        Detail result = postService.updatePost(postId, request, userEmail);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEqualTo("수정된 내용");
        assertThat(result.getVisibility()).isEqualTo("private");

        verify(postRepository).findById(postId);
        verify(postRepository).save(any(PostEntity.class));
    }

    @Test
    @DisplayName("게시글 삭제 성공")
    void testDeletePostSuccess() {
        // Given
        Long postId = 1L;
        String userEmail = "test@example.com";

        PostEntity existingPost = new PostEntity();
        existingPost.setId(postId);
        existingPost.setUserEmail(userEmail);

        when(postRepository.findById(postId)).thenReturn(Optional.of(existingPost));
        doNothing().when(postRepository).deleteById(postId);

        // When
        postService.deletePost(postId, userEmail);

        // Then
        verify(postRepository).findById(postId);
        verify(postRepository).deleteById(postId);
    }

    @Test
    @DisplayName("모든 게시글 조회")
    void testGetAllPosts() {
        // Given
        List<PostEntity> posts = Arrays.asList(
                createTestPostEntity(1L, "첫 번째 게시글"),
                createTestPostEntity(2L, "두 번째 게시글")
        );

        when(postRepository.findAllByOrderByCreatedAtDesc()).thenReturn(posts);

        // When
        List<Detail> result = postService.getAllPosts();

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getContent()).isEqualTo("첫 번째 게시글");
        assertThat(result.get(1).getContent()).isEqualTo("두 번째 게시글");

        verify(postRepository).findAllByOrderByCreatedAtDesc();
    }

    // Helper 메서드
    private PostEntity createTestPostEntity(Long id, String content) {
        PostEntity post = new PostEntity();
        post.setId(id);
        post.setContent(content);
        post.setUserEmail("test@example.com");
        post.setUserNickname("testuser");
        post.setVisibility("public");
        post.setCreatedAt(LocalDateTime.now());
        post.setLikeCount(0);
        post.setCommentCount(0);
        return post;
    }
}
