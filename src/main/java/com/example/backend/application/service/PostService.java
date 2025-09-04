// service/PostService.java
package com.example.backend.application.service;

import java.util.List;
import java.util.Optional;

import com.example.backend.api.dto.post.CreateRequest;
import com.example.backend.api.dto.post.Detail;
import com.example.backend.api.dto.post.Summary;
import com.example.backend.api.dto.post.UpdateRequest;

public interface PostService {
    Detail createPost(CreateRequest request, String userEmail);
    Detail updatePost(Long postId, UpdateRequest request, String userEmail);
    void deletePost(Long postId, String userEmail);
    List<Detail> getAllPosts();
    List<Summary> getPublicPosts();
    List<Detail> getPostsByUser(String userEmail);
    Optional<Detail> getPostDetail(Long postId);
    long getPostCountByVisibility(String userEmail, String visibility);
    List<Summary> getRecentPosts(int limit);
}
