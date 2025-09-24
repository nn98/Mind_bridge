package com.example.backend.security;

import org.springframework.stereotype.Component;

import com.example.backend.entity.ChatSessionEntity;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.ChatSessionRepository;
import com.example.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatAuth {

	private final ChatSessionRepository chatSessionRepository;
	private final UserRepository userRepository;

	/**
	 * 채팅 세션 접근 권한 확인
	 * - 세션 소유자(userEmail) 본인만 접근 가능
	 * - 관리자 권한은 @PreAuthorize의 hasRole('ADMIN')에서 처리
	 */
	public boolean canAccessSession(String sessionId, String requesterEmail) {
		log.debug("=== ChatAuth.canAccessSession 호출됨 ===");
		log.debug("sessionId: {}", sessionId);
		log.debug("requesterEmail: {}", requesterEmail);

		if (sessionId == null || sessionId.isBlank() ||
			requesterEmail == null || requesterEmail.isBlank()) {
			log.debug("=== 초기 검증 실패 ===");
			return false;
		}

		// 1. 요청자 정보 조회
		UserEntity requester = userRepository.findByEmail(requesterEmail)
			.orElse(null);
		if (requester == null) {
			log.debug("=== 사용자를 찾을 수 없음: {} ===", requesterEmail);
			return false;
		}

		// 2. 채팅 세션 조회 및 소유자 확인
		boolean canAccess = chatSessionRepository.findBySessionId(sessionId)
			.map(session -> {
				log.debug("세션 소유자: {}, 요청자: {}", session.getUserEmail(), requesterEmail);
				return session.getUserEmail().equals(requesterEmail);
			})
			.orElse(false);

		log.debug("=== 접근 권한 결과: {} ===", canAccess);
		return canAccess;
	}

	/**
	 * 채팅 메시지 수정/삭제 권한 확인 (향후 확장용)
	 */
	public boolean canModifyMessage(Long messageId, String requesterEmail) {
		if (messageId == null || requesterEmail == null || requesterEmail.isBlank()) {
			return false;
		}

		// 향후 ChatMessageRepository 구현 시 추가
		// return chatMessageRepository.findById(messageId)
		//     .map(message -> message.getUserEmail().equals(requesterEmail))
		//     .orElse(false);

		log.debug("ChatAuth.canModifyMessage - messageId: {}, requesterEmail: {}", messageId, requesterEmail);
		return true; // 임시로 모든 접근 허용
	}

	/**
	 * 채팅 세션 삭제 권한 확인
	 */
	public boolean canDeleteSession(String sessionId, String requesterEmail) {
		// 세션 접근 권한과 동일한 로직
		return canAccessSession(sessionId, requesterEmail);
	}
}
