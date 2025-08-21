package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.backend.entity.PostEntity;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.request.PostRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    // 게시글 작성
    public PostEntity createPost(PostRequest postRequest, String userEmail) {
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        PostEntity post = new PostEntity();
        post.setContent(postRequest.getContent());
        post.setVisibility(postRequest.getVisibility());
        post.setUserEmail(userEmail);
        post.setUserNickname(user.getNickname());
        post.setCreatedAt(LocalDateTime.now());

        return postRepository.save(post);
    }

    // 수정
    public PostEntity updatePost(Long postId, PostRequest postRequest, String userEmail) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        if (!post.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("게시글 수정 권한이 없습니다.");
        }

        post.setContent(postRequest.getContent());
        post.setVisibility(postRequest.getVisibility());

        return postRepository.save(post);
    }

    // 삭제
    public void deletePost(Long postId, String userEmail) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        if (!post.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("게시글 삭제 권한이 없습니다.");
        }

        postRepository.deleteById(postId);
    }

    // 조회 로직 (그대로 유지)
    public List<PostEntity> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<PostEntity> getPublicPosts() {
        return postRepository.findByVisibility("public");
    }

    public List<PostEntity> getPostsByUserEmail(String userEmail) {
        return postRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
    }

    public Optional<PostEntity> getPostById(Long postId) {
        return postRepository.findById(postId);
    }
}
