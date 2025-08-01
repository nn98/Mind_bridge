package com.example.backend.service;

import com.example.backend.entity.Post;
import com.example.backend.repository.PostRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PostService {

    private final PostRepository postRepository;

    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    // 게시글 전체 조회
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    // 게시글 작성
    public Post createPost(Post post) {
        return postRepository.save(post);
    }

    // 게시글 삭제 (id로)
    public void deletePost(Long postId) {
        postRepository.deleteById(postId);
    }

    // 게시글 조회 등 필요에 따라 확장 가능
}
