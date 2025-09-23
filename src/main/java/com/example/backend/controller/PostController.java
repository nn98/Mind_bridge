package com.example.backend.controller;

import static com.example.backend.common.constant.PostConstants.Visibility.*;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.example.backend.security.SecurityUtil;
import com.example.backend.service.PostService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 게시글 관리를 위한 REST API 컨트롤러
 * - 실패는 예외 전파 → 전역 Advice가 ProblemDetail(JSON)로 응답
 */
@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;
    private final SecurityUtil securityUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Detail>>> getAllPosts() {
        List<Detail> posts = postService.getAllPosts();
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<Summary>>> getPublicPosts() {
        List<Summary> publicPosts = postService.getPublicPosts();
        return ResponseEntity.ok(ApiResponse.success(publicPosts));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<Summary>>> getRecentPosts(@RequestParam(defaultValue = "10") int limit) {
        List<Summary> recentPosts = postService.getRecentPosts(limit);
        return ResponseEntity.ok(ApiResponse.success(recentPosts));
    }

    @GetMapping("/user/{email}")
    public ResponseEntity<ApiResponse<List<Detail>>> getPostsByUser(@PathVariable String email) {
        List<Detail> userPosts = postService.getPostsByUser(email);
        return ResponseEntity.ok(ApiResponse.success(userPosts));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Detail>>> getMyPosts(Authentication authentication) {
        String userEmail = securityUtil.requirePrincipalEmail(authentication);
        List<Detail> myPosts = postService.getPostsByUser(userEmail);
        return ResponseEntity.ok(ApiResponse.success(myPosts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Detail>> getPost(@PathVariable Long id) {
        return postService.getPostDetail(id)
            .map(detail -> ResponseEntity.ok(ApiResponse.success(detail)))
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("게시글을 찾을 수 없습니다.", null)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Detail>> createPost(@Valid @RequestBody CreateRequest request, Authentication authentication) {
        log.info("createPost request: {}", request);
        String userEmail = securityUtil.requirePrincipalEmail(authentication);
        Detail createdPost = postService.createPost(request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(createdPost, "게시글이 성공적으로 작성되었습니다."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@postAuth.canModify(#id, authentication.name) or hasRole('ADMIN') or hasRole('admin')")
    public ResponseEntity<ApiResponse<Detail>> updatePost(
        @PathVariable Long id,
        @Valid @RequestBody UpdateRequest request,
        Authentication authentication) {
        Detail updatedPost = postService.updatePost(id, request, securityUtil.requirePrincipalEmail(authentication));
        return ResponseEntity.ok(ApiResponse.success(updatedPost, "게시글이 성공적으로 수정되었습니다."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@postAuth.canModify(#id, authentication.name) or hasRole('ADMIN') or hasRole('admin')")
    public ResponseEntity<ApiResponse<String>> deletePost(
        @PathVariable Long id,
        Authentication authentication) {
        postService.deletePost(id, securityUtil.requirePrincipalEmail(authentication));
        return ResponseEntity.ok(ApiResponse.success("게시글이 성공적으로 삭제되었습니다."));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Object>> getPostStats(Authentication authentication) {
        String userEmail = securityUtil.requirePrincipalEmail(authentication);
        long publicCount = postService.getPostCountByVisibility(userEmail, PUBLIC);
        long privateCount = postService.getPostCountByVisibility(userEmail, PRIVATE);
        long friendsCount = postService.getPostCountByVisibility(userEmail, "friends");
        Object stats = Map.of(
            "publicCount", publicCount,
            "privateCount", privateCount,
            "friendsCount", friendsCount,
            "totalCount", publicCount + privateCount + friendsCount
        );
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
