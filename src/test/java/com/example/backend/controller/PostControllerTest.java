// src/test/java/com/example/backend/controller/PostControllerTest.java
package com.example.backend.controller;

import com.example.backend.api.controller.PostController;
import com.example.backend.config.TestConfig;
import com.example.backend.api.dto.post.CreateRequest;
import com.example.backend.api.dto.post.Detail;
import com.example.backend.api.dto.post.UpdateRequest;
import com.example.backend.infrastructure.security.CustomUserDetailsService;
import com.example.backend.infrastructure.security.JwtUtil;
import com.example.backend.infrastructure.security.TestMailConfig;
import com.example.backend.application.service.PostService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PostController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@Import({TestConfig.class, JwtUtil.class, TestMailConfig.class})
@WithMockUser(username = "test@example.com", roles = {"USER"})
class PostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PostService postService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("모든 게시글 조회")
    void testGetAllPosts() throws Exception {
        // Given
        List<Detail> posts = Arrays.asList(
                createTestDetail(1L, "첫 번째 게시글"),
                createTestDetail(2L, "두 번째 게시글")
        );

        when(postService.getAllPosts()).thenReturn(posts);

        // When & Then
        mockMvc.perform(get("/api/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].content").value("첫 번째 게시글"));

        verify(postService).getAllPosts();
    }

    @Test
    @DisplayName("게시글 작성 성공")
    @WithMockUser(username = "test@example.com")
    void testCreatePostSuccess() throws Exception {
        // Given
        CreateRequest request = new CreateRequest();
        request.setContent("새로운 게시글 내용");
        request.setVisibility("public");

        Detail createdPost = createTestDetail(1L, "새로운 게시글 내용");

        when(postService.createPost(any(CreateRequest.class), eq("test@example.com")))
                .thenReturn(createdPost);

        // When & Then
        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("새로운 게시글 내용"));

        verify(postService).createPost(any(CreateRequest.class), eq("test@example.com"));
    }

    @Test
    @DisplayName("게시글 상세 조회 성공")
    void testGetPostSuccess() throws Exception {
        // Given
        Long postId = 1L;
        Detail detail = createTestDetail(postId, "상세 게시글");

        when(postService.getPostDetail(postId)).thenReturn(Optional.of(detail));

        // When & Then
        mockMvc.perform(get("/api/posts/{id}", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("상세 게시글"));

        verify(postService).getPostDetail(postId);
    }

    @Test
    @DisplayName("게시글 수정 성공")
    @WithMockUser(username = "test@example.com")
    void testUpdatePostSuccess() throws Exception {
        // Given
        Long postId = 1L;
        UpdateRequest request = new UpdateRequest();
        request.setContent("수정된 게시글 내용");
        request.setVisibility("private");

        Detail updatedPost = createTestDetail(postId, "수정된 게시글 내용");

        when(postService.updatePost(eq(postId), any(UpdateRequest.class), eq("test@example.com")))
                .thenReturn(updatedPost);

        // When & Then
        mockMvc.perform(put("/api/posts/{id}", postId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("수정된 게시글 내용"));

        verify(postService).updatePost(eq(postId), any(UpdateRequest.class), eq("test@example.com"));
    }

    @Test
    @DisplayName("게시글 삭제 성공")
    @WithMockUser(username = "test@example.com")
    void testDeletePostSuccess() throws Exception {
        // Given
        Long postId = 1L;

        doNothing().when(postService).deletePost(postId, "test@example.com");

        // When & Then
        mockMvc.perform(delete("/api/posts/{id}", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(postService).deletePost(postId, "test@example.com");
    }

    // Helper 메서드
    private Detail createTestDetail(Long id, String content) {
        Detail detail = new Detail();
        detail.setId(id);
        detail.setContent(content);
        detail.setUserEmail("test@example.com");
        detail.setUserNickname("testuser");
        detail.setVisibility("public");
        detail.setCreatedAt(LocalDateTime.now());
        detail.setLikeCount(0);
        detail.setCommentCount(0);
        return detail;
    }
}
