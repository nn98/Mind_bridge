package com.example.backend.service;

import static com.example.backend.common.constant.PostConstants.Visibility.*;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.common.error.BadRequestException;
import com.example.backend.common.error.ForbiddenException;
import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.post.CreateRequest;
import com.example.backend.dto.post.Detail;
import com.example.backend.dto.post.Summary;
import com.example.backend.dto.post.UpdateRequest;
import com.example.backend.entity.PostEntity;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Transactional
    public Detail createPost(CreateRequest request, String userEmail) {
        log.debug("[Post#create] request: {}, userEmail: {}", request, userEmail);

        if (request == null || request.getContent() == null || request.getContent().isBlank()) {
            throw new BadRequestException("게시글 내용은 필수입니다.", "MISSING_CONTENT", "content");
        }

        UserEntity user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

        PostEntity post = PostEntity.builder()
            .title(normalizeTitle(request.getTitle()))
            .content(request.getContent().trim())
            .userId(user.getUserId())  // ✅ userId 저장 (정규화)
            .visibility(request.getVisibility() != null ? request.getVisibility() : "PUBLIC")
            .status("active")
            .likeCount(0)
            .commentCount(0)
            .viewCount(0)
            .build();

        PostEntity savedPost = postRepository.save(post);
        log.info("게시글 생성 완료 - ID: {}, 사용자: {}", savedPost.getPostId(), userEmail);

        return mapToDetail(savedPost);
    }

    @Transactional
    public Detail updatePost(Long postId, UpdateRequest request, String userEmail) {
        log.debug("[Post#update] postId: {}, request: {}, userEmail: {}", postId, request, userEmail);

        if (postId == null || postId <= 0) {
            throw new BadRequestException("유효하지 않은 게시글 ID입니다.", "INVALID_POST_ID", "postId");
        }

        PostEntity post = postRepository.findById(postId)
            .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다.", "POST_NOT_FOUND", "postId"));

        validateUserPermission(post, userEmail, "수정");
        updatePostFields(post, request);

        PostEntity updatedPost = postRepository.save(post);
        log.info("게시글 수정 완료 - ID: {}, 수정자: {}", postId, userEmail);

        return mapToDetail(updatedPost);
    }

    @Transactional
    public void deletePost(Long postId, String userEmail) {
        log.debug("[Post#delete] postId: {}, userEmail: {}", postId, userEmail);

        if (postId == null || postId <= 0) {
            throw new BadRequestException("유효하지 않은 게시글 ID입니다.", "INVALID_POST_ID", "postId");
        }

        PostEntity post = postRepository.findById(postId)
            .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다.", "POST_NOT_FOUND", "postId"));

        validateUserPermission(post, userEmail, "삭제");
        postRepository.deleteById(postId);

        log.info("게시글 삭제 완료 - ID: {}, 삭제자: {}", postId, userEmail);
    }

    @Transactional(readOnly = true)
    public List<Detail> getAllPosts() {
        List<PostEntity> posts = postRepository.findAllByOrderByCreatedAtDesc();
        log.debug("[Post#list] found {} posts", posts.size());

        return posts.stream().map(this::mapToDetail).toList();
    }

    @Transactional(readOnly = true)
    public List<Summary> getPublicPosts() {
        List<PostEntity> posts = postRepository.findByVisibilityOrderByCreatedAtDesc(PUBLIC);
        log.debug("[Post#publicList] found {} public posts", posts.size());

        return posts.stream().map(this::mapToSummary).toList();
    }

    @Transactional(readOnly = true)
    public List<Detail> getPostsByUser(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new BadRequestException("사용자 이메일은 필수입니다.", "MISSING_USER_EMAIL", "userEmail");
        }

        UserEntity user = userRepository.findByEmail(userEmail).orElse(null);
        List<PostEntity> posts = postRepository.findByUserIdOrderByCreatedAtDesc(user.getUserId()); // ✅ userId 사용
        log.debug("[Post#userList] userEmail: {}, found {} posts", userEmail, posts.size());

        return posts.stream().map(this::mapToDetail).toList();
    }

    @Transactional(readOnly = true)
    public Optional<Detail> getPostDetail(Long postId) {
        if (postId == null || postId <= 0) {
            return Optional.empty();
        }

        Optional<Detail> result = postRepository.findById(postId).map(this::mapToDetail);
        log.debug("[Post#detail] postId: {}, found: {}", postId, result.isPresent());

        return result;
    }

    @Transactional(readOnly = true)
    public long getPostCountByVisibility(String userEmail, String visibility) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new BadRequestException("사용자 이메일은 필수입니다.", "MISSING_USER_EMAIL", "userEmail");
        }
        UserEntity user = userRepository.findByEmail(userEmail).orElse(null);
        return postRepository.countByUserIdAndVisibility(user.getUserId(), visibility);
    }

    @Transactional(readOnly = true)
    public List<Summary> getRecentPosts(int limit) {
        if (limit <= 0 || limit > 100) {
            throw new BadRequestException("조회 개수는 1~100 사이여야 합니다.", "INVALID_LIMIT", "limit");
        }

        List<PostEntity> posts = postRepository.findTopNByOrderByCreatedAtDesc(limit);
        log.debug("[Post#recent] limit: {}, found: {}", limit, posts.size());

        return posts.stream().map(this::mapToSummary).toList();
    }

    // ====== private helpers ======

    private String normalizeTitle(String title) {
        if (title == null || title.isBlank()) {
            return "제목 없음";
        }
        return title.trim();
    }

    private void updatePostFields(PostEntity post, UpdateRequest request) {
        if (request.getTitle() != null) {
            post.setTitle(normalizeTitle(request.getTitle()));
        }
        if (request.getContent() != null) {
            if (request.getContent().isBlank()) {
                throw new BadRequestException("게시글 내용은 비워둘 수 없습니다.", "EMPTY_CONTENT", "content");
            }
            post.setContent(request.getContent().trim());
        }
        if (request.getVisibility() != null) {
            post.setVisibility(request.getVisibility());
        }
    }

    private void validateUserPermission(PostEntity post, String userEmail, String action) {
        UserEntity user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다.", "USER_NOT_FOUND", "userEmail"));

        // ✅ ADMIN 권한 체크 - 모든 게시글 접근 가능
        if ("admin".equalsIgnoreCase(user.getRole())) {
            log.info("ADMIN 권한으로 {} 허용 - 사용자: {}, 게시글: {}", action, userEmail, post.getPostId());
            return;
        }

        // 일반 사용자는 본인 게시글만 접근 가능
        if (!post.getUserId().equals(user.getUserId())) {
            throw new ForbiddenException("게시글 " + action + " 권한이 없습니다.");
        }

        log.debug("게시글 {} 권한 확인 완료 - 사용자: {}, 게시글: {}", action, userEmail, post.getPostId());
    }

    private Detail mapToDetail(PostEntity post) {
        UserEntity author = userRepository.findById(post.getUserId())
            .orElse(createDeletedUserPlaceholder());

        Detail detail = new Detail();
        detail.setId(post.getPostId());
        detail.setTitle(post.getTitle());
        detail.setContent(post.getContent());
        detail.setUserEmail(author.getEmail());
        detail.setUserNickname(author.getNickname());
        detail.setVisibility(post.getVisibility());
        detail.setCreatedAt(post.getCreatedAt());
        detail.setUpdatedAt(post.getUpdatedAt());
        detail.setLikeCount(post.getLikeCount() != null ? post.getLikeCount() : 0);
        detail.setCommentCount(post.getCommentCount() != null ? post.getCommentCount() : 0);
        detail.setLikedByCurrentUser(false); // TODO: 구현
        return detail;
    }

    private Summary mapToSummary(PostEntity post) {
        UserEntity author = userRepository.findById(post.getUserId())
            .orElse(createDeletedUserPlaceholder());

        Summary summary = new Summary();
        summary.setId(post.getPostId());
        summary.setContentPreview(truncateContent(post.getContent(), 100));
        summary.setUserNickname(author.getNickname());  // ✅ JOIN으로 실시간 조회
        summary.setVisibility(post.getVisibility());
        summary.setCreatedAt(post.getCreatedAt());
        summary.setLikeCount(post.getLikeCount() != null ? post.getLikeCount() : 0);
        summary.setCommentCount(post.getCommentCount() != null ? post.getCommentCount() : 0);
        return summary;
    }

    private UserEntity createDeletedUserPlaceholder() {
        return UserEntity.builder()
            .userId(-1L)
            .email("deleted@user.com")
            .nickname("탈퇴한 사용자")
            .fullName("탈퇴한 사용자")
            .build();
    }

    private String truncateContent(String content, int maxLength) {
        if (content == null || content.length() <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength) + "...";
    }
}
