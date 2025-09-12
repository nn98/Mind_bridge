package com.example.backend.security;

import org.springframework.stereotype.Component;

import com.example.backend.entity.PostEntity;
import com.example.backend.repository.PostRepository;

@Component
public class PostAuth {

	private final PostRepository postRepository;

	public PostAuth(PostRepository postRepository) {
		this.postRepository = postRepository;
	}

	// 작성자 또는 관리자(관리자 검사는 @PreAuthorize의 hasRole로 처리)
	public boolean canModify(Long postId, String requesterEmail) {
		if (postId == null || requesterEmail == null || requesterEmail.isBlank()) return false;
		return postRepository.findById(postId)
			.map(PostEntity::getUserEmail)
			.filter(owner -> owner.equals(requesterEmail))
			.isPresent();
	}
}
