// service/impl/PostServiceImpl.java
package com.example.backend.application.impl;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.api.dto.post.CreateRequest;
import com.example.backend.api.dto.post.Detail;
import com.example.backend.api.dto.post.Summary;
import com.example.backend.api.dto.post.UpdateRequest;
import com.example.backend.infrastructure.persistence.entity.PostEntity;
import com.example.backend.infrastructure.persistence.entity.UserEntity;
import com.example.backend.domain.post.PostRepository;
import com.example.backend.domain.user.UserRepository;
import com.example.backend.application.service.PostService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Detail createPost(CreateRequest request, String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        PostEntity post = createPostEntity(request, userEmail, user.getNickname());
        PostEntity savedPost = postRepository.save(post);
        log.info("새 게시글 작성 완료 - ID: {}, 작성자: {}", savedPost.getId(), userEmail);
        return mapToDetail(savedPost);
    }

    @Override
    @Transactional
    public Detail updatePost(Long postId, UpdateRequest request, String userEmail) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        validateUserPermission(post, userEmail, "수정");
        updatePostFields(post, request);
        PostEntity updatedPost = postRepository.save(post);
        log.info("게시글 수정 완료 - ID: {}, 수정자: {}", postId, userEmail);
        return mapToDetail(updatedPost);
    }

    @Override
    @Transactional
    public void deletePost(Long postId, String userEmail) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        validateUserPermission(post, userEmail, "삭제");
        postRepository.deleteById(postId);
        log.info("게시글 삭제 완료 - ID: {}, 삭제자: {}", postId, userEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Detail> getAllPosts() {
        List<PostEntity> posts = postRepository.findAllByOrderByCreatedAtDesc();
        return posts.stream().map(this::mapToDetail).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Summary> getPublicPosts() {
        List<PostEntity> posts = postRepository.findByVisibilityOrderByCreatedAtDesc("public");
        return posts.stream().map(this::mapToSummary).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Detail> getPostsByUser(String userEmail) {
        List<PostEntity> posts = postRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        return posts.stream().map(this::mapToDetail).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Detail> getPostDetail(Long postId) {
        return postRepository.findById(postId).map(this::mapToDetail);
    }

    @Override
    @Transactional(readOnly = true)
    public long getPostCountByVisibility(String userEmail, String visibility) {
        return postRepository.countByUserEmailAndVisibility(userEmail, visibility);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Summary> getRecentPosts(int limit) {
        List<PostEntity> posts = postRepository.findTopNByOrderByCreatedAtDesc(limit);
        return posts.stream().map(this::mapToSummary).collect(Collectors.toList());
    }

    // ====== private helpers ======
    private PostEntity createPostEntity(CreateRequest request, String userEmail, String userNickname) {
        PostEntity post = new PostEntity();
        post.setContent(request.getContent());
        post.setVisibility(request.getVisibility());
        post.setUserEmail(userEmail);
        post.setUserNickname(userNickname);
        return post;
    }

    private void updatePostFields(PostEntity post, UpdateRequest request) {
        if (request.getContent() != null) {
            post.setContent(request.getContent());
        }
        if (request.getVisibility() != null) {
            post.setVisibility(request.getVisibility());
        }
    }

    private void validateUserPermission(PostEntity post, String userEmail, String action) {

        // 관리자 권한 확인하는 부분
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!post.getUserEmail().equals(userEmail)&& !isAdmin) {
            throw new RuntimeException("게시글 " + action + " 권한이 없습니다.");
        }
    }

    private Detail mapToDetail(PostEntity post) {
        Detail detail = new Detail();
        detail.setId(post.getId());
        detail.setContent(post.getContent());
        detail.setUserEmail(post.getUserEmail());
        detail.setUserNickname(post.getUserNickname());
        detail.setVisibility(post.getVisibility());
        detail.setCreatedAt(post.getCreatedAt());
        detail.setUpdatedAt(post.getUpdatedAt());
        // TODO: 좋아요/댓글 집계 연동
        detail.setLikeCount(0);
        detail.setCommentCount(0);
        detail.setLikedByCurrentUser(false);
        return detail;
    }

    private Summary mapToSummary(PostEntity post) {
        Summary summary = new Summary();
        summary.setId(post.getId());
        summary.setContentPreview(truncateContent(post.getContent(), 100));
        summary.setUserNickname(post.getUserNickname());
        summary.setVisibility(post.getVisibility());
        summary.setCreatedAt(post.getCreatedAt());
        // TODO: 좋아요/댓글 집계 연동
        summary.setLikeCount(0);
        summary.setCommentCount(0);
        return summary;
    }

    private String truncateContent(String content, int maxLength) {
        if (content == null || content.length() <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength) + "...";
    }
}
