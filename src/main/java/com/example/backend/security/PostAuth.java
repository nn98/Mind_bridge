package com.example.backend.security;

import org.springframework.stereotype.Component;

import com.example.backend.entity.UserEntity;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class PostAuth {

	private final PostRepository postRepository;
	private final UserRepository userRepository;  // ✅ 추가

	/**
	 * 게시글 작성자 확인 (정규화 대응)
	 * - 작성자 본인만 수정/삭제 가능
	 * - 관리자 권한은 @PreAuthorize의 hasRole('ADMIN')에서 처리
	 */
	public boolean canModify(Long postId, String requesterEmail) {
		System.out.println("=== PostAuth.canModify 호출됨 ===");
		System.out.println("postId: " + postId);
		System.out.println("requesterEmail: " + requesterEmail);

		if (postId == null || requesterEmail == null || requesterEmail.isBlank()) {
			System.out.println("=== 초기 검증 실패 ===");
			return false;
		}

		// 1. 요청자 정보 조회
		UserEntity requester = userRepository.findByEmail(requesterEmail)
			.orElse(null);
		if (requester == null) {
			return false;
		}

		// 2. 게시글 조회 및 작성자 확인 (정규화된 userId 기반)
		return postRepository.findById(postId)
			.map(post -> post.getUserId().equals(requester.getUserId()))  // ✅ userId 비교
			.orElse(false);
	}
}
