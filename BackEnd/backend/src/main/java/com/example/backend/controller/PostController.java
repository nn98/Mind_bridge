package com.example.backend.controller;

import com.example.backend.entity.Post;
import com.example.backend.repository.PostRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostRepository postRepository;

    @GetMapping
    public List<Post> getPosts() {
        return postRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Post post, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        post.setCreatedAt(java.time.LocalDateTime.now());
        post.setUserId(authentication.getName());  // 인증된 이메일저장

        postRepository.save(post);
        return ResponseEntity.ok(post);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication authentication) {
        Optional<Post> postOpt = postRepository.findById(id);

        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (!postOpt.get().getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(403).build();
        }

        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
