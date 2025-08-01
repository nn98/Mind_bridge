package com.example.backend.service;

import com.example.backend.dto.PostRequest;
import com.example.backend.entity.Post;
import com.example.backend.entity.User;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    // 게시글 전체 조회 (최신순)
    public List<Post> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    // 공개 게시글만 조회
    public List<Post> getPublicPosts() {
        return postRepository.findByVisibility("public");
    }

    // 특정 사용자 게시글 조회
    public List<Post> getPostsByUserEmail(String userEmail) {
        return postRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
    }

    // 게시글 상세 조회
    public Optional<Post> getPostById(Long postId) {
        return postRepository.findById(postId);
    }

    // 게시글 작성
    public Post createPost(PostRequest postRequest, String userEmail) {
        // 사용자 정보 조회
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Post post = new Post();
        post.setContent(postRequest.getContent());
        post.setVisibility(postRequest.getVisibility());
        post.setUserEmail(userEmail);
        post.setUserNickname(user.getNickname());
        post.setCreatedAt(LocalDateTime.now());

        return postRepository.save(post);
    }

    // 게시글 수정
    public Post updatePost(Long postId, PostRequest postRequest, String userEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        // 작성자 확인
        if (!post.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("게시글 수정 권한이 없습니다.");
        }

        post.setContent(postRequest.getContent());
        post.setVisibility(postRequest.getVisibility());

        return postRepository.save(post);
    }

    // 게시글 삭제
    public void deletePost(Long postId, String userEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        // 작성자 확인
        if (!post.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("게시글 삭제 권한이 없습니다.");
        }

        postRepository.deleteById(postId);
    }

    // 사용자별 게시글 수 조회
    public long getPostCountByUserEmail(String userEmail) {
        return postRepository.findByUserEmail(userEmail).size();
    }

    // 특정 공개 설정의 게시글 조회
    public List<Post> getPostsByVisibility(String visibility) {
        return postRepository.findByVisibility(visibility);
    }

    // 사용자별 특정 공개 설정 게시글 조회
    public List<Post> getPostsByUserEmailAndVisibility(String userEmail, String visibility) {
        return postRepository.findByUserEmailAndVisibility(userEmail, visibility);
    }
}
