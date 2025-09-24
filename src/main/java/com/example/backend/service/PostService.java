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
import com.example.backend.mapper.PostMapper;
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
    private final PostMapper postMapper; // ✅ PostMapper 주입

    @Transactional
    public Detail createPost(CreateRequest request, String userEmail) {
        log.debug("[Post#create] request: {}, userEmail: {}", request, userEmail);

        if (request == null || request.getContent() == null || request.getContent().isBlank()) {
            throw new BadRequestException("게시글 내용은 필수입니다.", "MISSING_CONTENT", "content");
        }

        UserEntity user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

        // ✅ PostMapper 사용 (기존 로직과 완전히 동일한 결과)
        PostEntity post = postMapper.toEntity(request, user);
        PostEntity savedPost = postRepository.save(post);

        log.info("게시글 생성 완료 - ID: {}, 사용자: {}", savedPost.getPostId(), userEmail);

        // ✅ PostMapper 사용 (기존 mapToDetail과 완전히 동일한 결과)
        return postMapper.toDetail(savedPost, userRepository);
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
        updatePostFields(post, request); // ✅ 기존 로직 유지

        PostEntity updatedPost = postRepository.save(post);
        log.info("게시글 수정 완료 - ID: {}, 수정자: {}", postId, userEmail);

        // ✅ PostMapper 사용
        return postMapper.toDetail(updatedPost, userRepository);
    }

    @Transactional
    public void deletePost(Long postId, String userEmail) {
        log.debug("[Post#delete] postId: {}, userEmail: {}", postId, userEmail);

        if (postId == null || postId <= 0) {
            throw new BadRequestException("유효하지 않은 게시글 ID입니다.", "INVALID_POST_ID", "postId");
        }

        PostEntity post = postRepository.findById(postId)
            .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다.", "POST_NOT_FOUND", "postId"));

        validateUserPermission(post, userEmail, "삭제"); // ✅ 기존 로직 유지
        postRepository.deleteById(postId);

        log.info("게시글 삭제 완료 - ID: {}, 삭제자: {}", postId, userEmail);
    }

    @Transactional(readOnly = true)
    public List<Detail> getAllPosts() {
        List<PostEntity> posts = postRepository.findAllByOrderByCreatedAtDesc();
        log.debug("[Post#list] found {} posts", posts.size());

        // ✅ PostMapper 사용 (기존 stream().map() 로직과 완전히 동일)
        return postMapper.toDetailList(posts, userRepository);
    }

    @Transactional(readOnly = true)
    public List<Summary> getPublicPosts() {
        List<PostEntity> posts = postRepository.findByVisibilityOrderByCreatedAtDesc(PUBLIC);
        log.debug("[Post#publicList] found {} public posts", posts.size());

        // ✅ PostMapper 사용 (기존 stream().map() 로직과 완전히 동일)
        return postMapper.toSummaryList(posts, userRepository);
    }

    @Transactional(readOnly = true)
    public List<Detail> getPostsByUser(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new BadRequestException("사용자 이메일은 필수입니다.", "MISSING_USER_EMAIL", "userEmail");
        }

        UserEntity user = userRepository.findByEmail(userEmail).orElse(null);
        List<PostEntity> posts = postRepository.findByUserIdOrderByCreatedAtDesc(user.getUserId());
        log.debug("[Post#userList] userEmail: {}, found {} posts", userEmail, posts.size());

        // ✅ PostMapper 사용 (기존 stream().map() 로직과 완전히 동일)
        return postMapper.toDetailList(posts, userRepository);
    }

    @Transactional(readOnly = true)
    public Optional<Detail> getPostDetail(Long postId) {
        if (postId == null || postId <= 0) {
            return Optional.empty();
        }

        // ✅ PostMapper 사용 (기존 map(this::mapToDetail) 로직과 완전히 동일)
        Optional<Detail> result = postRepository.findById(postId)
            .map(post -> postMapper.toDetail(post, userRepository));

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

        // ✅ PostMapper 사용 (기존 stream().map() 로직과 완전히 동일)
        return postMapper.toSummaryList(posts, userRepository);
    }

    // ================== private helpers (변경 없음) ==================

    private void updatePostFields(PostEntity post, UpdateRequest request) {
        if (request.getTitle() != null) {
            // ✅ PostMapper의 normalizeTitle 사용 (기존과 완전히 동일)
            post.setTitle(postMapper.normalizeTitle(request.getTitle()));
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
}
