package com.example.backend.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 게시글 관리를 위한 비즈니스 로직 서비스
 * 게시글 CRUD 및 조회 필터링 기능 제공
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    /**
     * 게시글 작성
     * @param request 게시글 작성 요청
     * @param userEmail 작성자 이메일
     * @return 생성된 게시글 상세 정보
     * @throws RuntimeException 사용자를 찾을 수 없을 시
     */
    @Transactional
    public Detail createPost(CreateRequest request, String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        PostEntity post = createPostEntity(request, userEmail, user.getNickname());
        PostEntity savedPost = postRepository.save(post);

        log.info("새 게시글 작성 완료 - ID: {}, 작성자: {}", savedPost.getId(), userEmail);
        return mapToDetail(savedPost);
    }

    /**
     * 게시글 수정
     * @param postId 수정할 게시글 ID
     * @param request 수정 요청 정보
     * @param userEmail 수정 요청자 이메일
     * @return 수정된 게시글 상세 정보
     * @throws RuntimeException 게시글을 찾을 수 없거나 권한이 없을 시
     */
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

    /**
     * 게시글 삭제
     * @param postId 삭제할 게시글 ID
     * @param userEmail 삭제 요청자 이메일
     * @throws RuntimeException 게시글을 찾을 수 없거나 권한이 없을 시
     */
    @Transactional
    public void deletePost(Long postId, String userEmail) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        validateUserPermission(post, userEmail, "삭제");

        postRepository.deleteById(postId);
        log.info("게시글 삭제 완료 - ID: {}, 삭제자: {}", postId, userEmail);
    }

    /**
     * 모든 게시글 조회 (최신순)
     * @return 모든 게시글 상세 정보 목록
     */
    @Transactional(readOnly = true)
    public List<Detail> getAllPosts() {
        List<PostEntity> posts = postRepository.findAllByOrderByCreatedAtDesc();
        return posts.stream()
                .map(this::mapToDetail)
                .collect(Collectors.toList());
    }

    /**
     * 공개 게시글 목록 조회 (요약형)
     * @return 공개 게시글 요약 정보 목록
     */
    @Transactional(readOnly = true)
    public List<Summary> getPublicPosts() {
        List<PostEntity> posts = postRepository.findByVisibilityOrderByCreatedAtDesc("public");
        return posts.stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());
    }

    /**
     * 사용자별 게시글 목록 조회
     * @param userEmail 조회할 사용자 이메일
     * @return 해당 사용자의 게시글 상세 정보 목록
     */
    @Transactional(readOnly = true)
    public List<Detail> getPostsByUser(String userEmail) {
        List<PostEntity> posts = postRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
        return posts.stream()
                .map(this::mapToDetail)
                .collect(Collectors.toList());
    }

    /**
     * 게시글 상세 조회
     * @param postId 조회할 게시글 ID
     * @return 게시글 상세 정보 (Optional)
     */
    @Transactional(readOnly = true)
    public Optional<Detail> getPostDetail(Long postId) {
        return postRepository.findById(postId)
                .map(this::mapToDetail);
    }

    /**
     * 공개 설정별 게시글 수 조회
     * @param userEmail 사용자 이메일
     * @param visibility 공개 설정 (public, private, friends)
     * @return 해당 조건의 게시글 수
     */
    @Transactional(readOnly = true)
    public long getPostCountByVisibility(String userEmail, String visibility) {
        return postRepository.countByUserEmailAndVisibility(userEmail, visibility);
    }

    /**
     * 최근 게시글 조회 (지정한 개수만큼)
     * @param limit 조회할 게시글 개수
     * @return 최근 게시글 요약 정보 목록
     */
    @Transactional(readOnly = true)
    public List<Summary> getRecentPosts(int limit) {
        List<PostEntity> posts = postRepository.findTopNByOrderByCreatedAtDesc(limit);
        return posts.stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());
    }

    // === Private Helper Methods ===

    /**
     * CreateRequest로부터 PostEntity 생성
     */
    private PostEntity createPostEntity(CreateRequest request, String userEmail, String userNickname) {
        PostEntity post = new PostEntity();
        post.setContent(request.getContent());
        post.setVisibility(request.getVisibility());
        post.setUserEmail(userEmail);
        post.setUserNickname(userNickname);
        return post;
    }

    /**
     * 게시글 필드 업데이트
     */
    private void updatePostFields(PostEntity post, UpdateRequest request) {
        if (request.getContent() != null) {
            post.setContent(request.getContent());
        }
        if (request.getVisibility() != null) {
            post.setVisibility(request.getVisibility());
        }
    }

    /**
     * 사용자 권한 검증
     */
    private void validateUserPermission(PostEntity post, String userEmail, String action) {
        if (!post.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("게시글 " + action + " 권한이 없습니다.");
        }
    }

    /**
     * PostEntity → Detail DTO 변환
     */
    private Detail mapToDetail(PostEntity post) {
        Detail detail = new Detail();
        detail.setId(post.getId());
        detail.setContent(post.getContent());
        detail.setUserEmail(post.getUserEmail());
        detail.setUserNickname(post.getUserNickname());
        detail.setVisibility(post.getVisibility());
        detail.setCreatedAt(post.getCreatedAt());
        detail.setUpdatedAt(post.getUpdatedAt());
        // TODO: 좋아요 수, 댓글 수 등 추가 정보 설정
        detail.setLikeCount(0);
        detail.setCommentCount(0);
        detail.setLikedByCurrentUser(false);
        return detail;
    }

    /**
     * PostEntity → Summary DTO 변환
     */
    private Summary mapToSummary(PostEntity post) {
        Summary summary = new Summary();
        summary.setId(post.getId());
        summary.setContentPreview(truncateContent(post.getContent(), 100));
        summary.setUserNickname(post.getUserNickname());
        summary.setVisibility(post.getVisibility());
        summary.setCreatedAt(post.getCreatedAt());
        // TODO: 좋아요 수, 댓글 수 등 추가 정보 설정
        summary.setLikeCount(0);
        summary.setCommentCount(0);
        return summary;
    }

    /**
     * 내용 미리보기용 텍스트 자르기
     */
    private String truncateContent(String content, int maxLength) {
        if (content == null || content.length() <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength) + "...";
    }
}
