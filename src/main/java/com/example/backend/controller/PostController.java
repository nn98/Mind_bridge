package com.example.backend.controller;

import com.example.backend.dto.PostRequest;
import com.example.backend.entity.Post;
import com.example.backend.entity.User;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Post>> getPosts() {
        List<Post> posts = postRepository.findAll();
        return ResponseEntity.ok(posts);
    }

    @PostMapping
    public ResponseEntity<?> createPost(@Valid @RequestBody PostRequest postRequest, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("인증이 필요합니다");
        }

        String userEmail = authentication.getName(); // 인증된 사용자의 이메일

        // 사용자 정보 조회
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("사용자를 찾을 수 없습니다");
        }

        User user = userOpt.get();

        // Post 엔티티 생성
        Post post = new Post();
        post.setContent(postRequest.getContent());
        post.setVisibility(postRequest.getVisibility());
        post.setUserEmail(userEmail);                    // 이메일 설정
        post.setUserNickname(user.getNickname());        // 닉네임 설정
        post.setCreatedAt(java.time.LocalDateTime.now());

        Post savedPost = postRepository.save(post);
        return ResponseEntity.ok(savedPost);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPost(@PathVariable Long id) {
        Optional<Post> postOpt = postRepository.findById(id);

        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(postOpt.get());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id,
                                        @Valid @RequestBody PostRequest postRequest,
                                        Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("인증이 필요합니다");
        }

        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Post post = postOpt.get();

        // 작성자 확인 (이메일로 비교)
        if (!post.getUserEmail().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("수정 권한이 없습니다");
        }

        // 게시글 수정
        post.setContent(postRequest.getContent());
        post.setVisibility(postRequest.getVisibility());

        Post updatedPost = postRepository.save(post);
        return ResponseEntity.ok(updatedPost);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("인증이 필요합니다");
        }

        Optional<Post> postOpt = postRepository.findById(id);
        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Post post = postOpt.get();

        // 작성자 확인 (이메일로 비교)
        if (!post.getUserEmail().equals(authentication.getName())) {
            return ResponseEntity.status(403).body("삭제 권한이 없습니다");
        }

        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // 특정 사용자의 게시글 조회
    @GetMapping("/user/{email}")
    public ResponseEntity<List<Post>> getPostsByUserEmail(@PathVariable String email) {
        List<Post> posts = postRepository.findByUserEmail(email);
        return ResponseEntity.ok(posts);
    }

    // 공개 게시글만 조회
    @GetMapping("/public")
    public ResponseEntity<List<Post>> getPublicPosts() {
        List<Post> publicPosts = postRepository.findByVisibility("public");
        return ResponseEntity.ok(publicPosts);
    }
}
