package com.example.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.response.PostDto;
import com.example.backend.entity.PostEntity;
import com.example.backend.repository.PostRepository;
import com.example.backend.dto.request.PostRequest;
import com.example.backend.service.PostService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostRepository postRepository;
    private final PostService postService;

    //전체 조회
    @GetMapping
    public ResponseEntity<List<PostDto>> getPosts() {
        List<PostDto> posts = postService.getAllPosts();
        return ResponseEntity.ok(posts);
    }

    // 생성
    @PostMapping
    public ResponseEntity<?> createPost(@Valid @RequestBody PostRequest postRequest, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("인증이 필요합니다");
        }

        String userEmail = authentication.getName();
        PostEntity savedPost = postService.createPost(postRequest, userEmail);
        return ResponseEntity.ok(savedPost);
    }

    // 조회
    @GetMapping("/{id}")
    public ResponseEntity<?> getPost(@PathVariable Long id) {
        //System.out.println("getPost 요청 id: " + id);
        Optional<PostEntity> postOpt = postRepository.findById(id);

        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(postOpt.get());
    }

    // 수정
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable("id") Long id,
            @Valid @RequestBody PostRequest postRequest,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("인증이 필요합니다");
        }

        Optional<PostEntity> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PostEntity post = postOpt.get();

        // 관리자 권한 확인부분
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        // 작성자 확인 (이메일로 비교 or 관리자면 패스)
        if (!isAdmin && !post.getUserEmail().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("수정 권한이 없습니다");
        }

        // 게시글 수정
        post.setContent(postRequest.getContent());
        post.setVisibility(postRequest.getVisibility());

        PostEntity updatedPost = postRepository.save(post);
        return ResponseEntity.ok(updatedPost);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable("id") Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("인증이 필요합니다");
        }

        Optional<PostEntity> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PostEntity post = postOpt.get();

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        // 작성자 확인 (이메일로 비교)
        if (!isAdmin && !post.getUserEmail().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("삭제 권한이 없습니다");
        }

        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // 특정 사용자의 게시글 조회
    @GetMapping("/user/{email}")
    public ResponseEntity<List<PostEntity>> getPostsByUserEmail(@PathVariable String email) {
        List<PostEntity> posts = postRepository.findByUserEmail(email);
        return ResponseEntity.ok(posts);
    }

    // 공개 게시글만 조회
    @GetMapping("/public")
    public ResponseEntity<List<PostEntity>> getPublicPosts() {
        List<PostEntity> publicPosts = postRepository.findByVisibility("public");
        return ResponseEntity.ok(publicPosts);
    }
}
