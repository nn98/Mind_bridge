package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.common.ApiResponse;
import com.example.backend.dto.post.CreateRequest;
import com.example.backend.dto.post.Detail;
import com.example.backend.dto.post.Summary;
import com.example.backend.dto.post.UpdateRequest;
import com.example.backend.service.PostService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 게시글 관리를 위한 REST API 컨트롤러
 * 게시글 CRUD 및 조회 기능 제공
 */
@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    /**
     * 모든 게시글 조회 (최신순)
     * @return 게시글 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Detail>>> getAllPosts() {
        try {
            List<Detail> posts = postService.getAllPosts();
            return ResponseEntity.ok(ApiResponse.success(posts));
        } catch (Exception e) {
            log.error("전체 게시글 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("게시글 조회에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 공개 게시글 목록 조회 (요약형)
     * @return 공개 게시글 요약 목록
     */
    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<Summary>>> getPublicPosts() {
        try {
            List<Summary> publicPosts = postService.getPublicPosts();
            return ResponseEntity.ok(ApiResponse.success(publicPosts));
        } catch (Exception e) {
            log.error("공개 게시글 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("공개 게시글 조회에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 최근 게시글 조회
     * @param limit 조회할 게시글 수 (기본값: 10)
     * @return 최근 게시글 요약 목록
     */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<Summary>>> getRecentPosts(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<Summary> recentPosts = postService.getRecentPosts(limit);
            return ResponseEntity.ok(ApiResponse.success(recentPosts));
        } catch (Exception e) {
            log.error("최근 게시글 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("최근 게시글 조회에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 특정 사용자의 게시글 목록 조회
     * @param email 사용자 이메일
     * @return 해당 사용자의 게시글 목록
     */
    @GetMapping("/user/{email}")
    public ResponseEntity<ApiResponse<List<Detail>>> getPostsByUser(@PathVariable String email) {
        try {
            List<Detail> userPosts = postService.getPostsByUser(email);
            return ResponseEntity.ok(ApiResponse.success(userPosts));
        } catch (Exception e) {
            log.error("사용자별 게시글 조회 실패 - 사용자: {}, 오류: {}", email, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("사용자 게시글 조회에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 현재 사용자의 게시글 목록 조회
     * @param authentication 인증 정보
     * @return 현재 사용자의 게시글 목록
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Detail>>> getMyPosts(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<Detail> myPosts = postService.getPostsByUser(userEmail);
            return ResponseEntity.ok(ApiResponse.success(myPosts));
        } catch (Exception e) {
            log.error("내 게시글 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("내 게시글 조회에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 게시글 상세 조회
     * @param id 게시글 ID
     * @return 게시글 상세 정보
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Detail>> getPost(@PathVariable Long id) {
        try {
            return postService.getPostDetail(id)
                    .map(detail -> ResponseEntity.ok(ApiResponse.success(detail)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ApiResponse.error("게시글을 찾을 수 없습니다.", null)));
        } catch (Exception e) {
            log.error("게시글 상세 조회 실패 - ID: {}, 오류: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("게시글 조회에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 게시글 작성
     * @param request 게시글 작성 요청
     * @param authentication 인증 정보
     * @return 생성된 게시글 정보
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Detail>> createPost(
            @Valid @RequestBody CreateRequest request,
            Authentication authentication) {
        try {
            System.out.println("request: "+request);
            String userEmail = authentication.getName();
            Detail createdPost = postService.createPost(request, userEmail);

            log.info("새 게시글 작성 완료 - ID: {}, 작성자: {}", createdPost.getId(), userEmail);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(createdPost, "게시글이 성공적으로 작성되었습니다."));

        } catch (RuntimeException e) {
            log.error("게시글 작성 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage(), null));
        }
    }

    /**
     * 게시글 수정
     * @param id 수정할 게시글 ID
     * @param request 수정 요청 정보
     * @param authentication 인증 정보
     * @return 수정된 게시글 정보
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Detail>> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRequest request,
            Authentication authentication) {
        try {
            Detail updatedPost = postService.updatePost(id, request, authentication);

            log.info("게시글 수정 완료 - ID: {}, 수정자: {}", id, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(updatedPost, "게시글이 성공적으로 수정되었습니다."));

        } catch (RuntimeException e) {
            log.error("게시글 수정 실패 - ID: {}, 오류: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage(), null));
        }
    }

    /**
     * 게시글 삭제
     * @param id 삭제할 게시글 ID
     * @param authentication 인증 정보
     * @return 삭제 결과
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deletePost(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            postService.deletePost(id, authentication);

            log.info("게시글 삭제 완료 - ID: {}, 삭제자: {}", id, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success("게시글이 성공적으로 삭제되었습니다."));

        } catch (RuntimeException e) {
            log.error("게시글 삭제 실패 - ID: {}, 오류: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage(), null));
        }
    }

    /**
     * 게시글 통계 조회
     * @param authentication 인증 정보
     * @return 사용자의 게시글 통계
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Object>> getPostStats(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            long publicCount = postService.getPostCountByVisibility(userEmail, "public");
            long privateCount = postService.getPostCountByVisibility(userEmail, "private");
            long friendsCount = postService.getPostCountByVisibility(userEmail, "friends");

            Object stats = Map.of(
                    "publicCount", publicCount,
                    "privateCount", privateCount,
                    "friendsCount", friendsCount,
                    "totalCount", publicCount + privateCount + friendsCount
            );

            return ResponseEntity.ok(ApiResponse.success(stats));

        } catch (Exception e) {
            log.error("게시글 통계 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("게시글 통계 조회에 실패했습니다.", e.getMessage()));
        }
    }
}
