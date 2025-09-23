package com.example.backend.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.dto.chat.ChatMessageType;
import com.example.backend.dto.chat.ChatSessionDto;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;
import com.example.backend.mapper.ChatMapper;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.repository.ChatSessionRepository;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

	@Mock
	private ChatMessageRepository chatMessageRepository;

	@Mock
	private ChatSessionRepository chatSessionRepository;

	@Mock
	private ChatMapper chatMapper;

	@InjectMocks
	private ChatService chatService;

	// === 메시지 관련 테스트 ===

	@Test
	@DisplayName("메시지 저장 성공 테스트")
	void saveMessage_Success() {
		// Given
		ChatMessageRequest request = ChatMessageRequest.builder()
			.sessionId("test-session-id")
			.messageType(ChatMessageType.USER)
			.messageContent("안녕하세요")
			.userEmail("test@example.com")
			.chatStyle("default")
			.build();

		ChatMessageEntity mockEntity = ChatMessageEntity.builder()
			.messageId(1L)
			.sessionId("test-session-id")
			.messageType(ChatMessageType.USER)
			.messageContent("안녕하세요")
			.userEmail("test@example.com")
			.chatStyle("default")
			.createdAt(LocalDateTime.now())
			.build();

		ChatMessageEntity savedEntity = ChatMessageEntity.builder()
			.messageId(1L)
			.sessionId("test-session-id")
			.messageType(ChatMessageType.USER)
			.messageContent("안녕하세요")
			.userEmail("test@example.com")
			.chatStyle("default")
			.createdAt(LocalDateTime.now())
			.build();

		when(chatMapper.toEntity(request)).thenReturn(mockEntity);
		when(chatMessageRepository.save(mockEntity)).thenReturn(savedEntity);

		// When
		ChatMessageEntity result = chatService.saveMessage(request);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getMessageId()).isEqualTo(1L);
		assertThat(result.getSessionId()).isEqualTo("test-session-id");
		assertThat(result.getMessageType()).isEqualTo(ChatMessageType.USER);
		assertThat(result.getMessageContent()).isEqualTo("안녕하세요");

		verify(chatMapper).toEntity(request);
		verify(chatMessageRepository).save(mockEntity);
	}

	@Test
	@DisplayName("세션별 메시지 조회 테스트")
	void getMessagesBySessionId_Success() {
		// Given
		String sessionId = "test-session-id";

		List<ChatMessageEntity> mockMessages = List.of(
			ChatMessageEntity.builder()
				.messageId(1L)
				.sessionId(sessionId)
				.messageType(ChatMessageType.USER)
				.messageContent("안녕하세요")
				.userEmail("test@example.com")
				.chatStyle("default")
				.createdAt(LocalDateTime.now().minusMinutes(5))
				.build(),
			ChatMessageEntity.builder()
				.messageId(2L)
				.sessionId(sessionId)
				.messageType(ChatMessageType.AI)
				.messageContent("안녕하세요! 무엇을 도와드릴까요?")
				.emotion("{\"joy\": 0.9}")
				.userEmail("test@example.com")
				.chatStyle("empathetic")
				.createdAt(LocalDateTime.now())
				.build()
		);

		when(chatMessageRepository.findAllBySessionId(sessionId)).thenReturn(mockMessages);

		// When
		List<ChatMessageEntity> result = chatService.getMessagesBySessionId(sessionId);

		// Then
		assertThat(result).hasSize(2);
		assertThat(result.get(0).getMessageType()).isEqualTo(ChatMessageType.USER);
		assertThat(result.get(1).getMessageType()).isEqualTo(ChatMessageType.AI);
		assertThat(result.get(0).getMessageContent()).isEqualTo("안녕하세요");
		assertThat(result.get(1).getMessageContent()).isEqualTo("안녕하세요! 무엇을 도와드릴까요?");

		verify(chatMessageRepository).findAllBySessionId(sessionId);
	}

	// === 세션 관련 테스트 ===

	@Test
	@DisplayName("세션 저장 성공 테스트")
	void saveSession_Success() {
		// Given
		SessionRequest request = SessionRequest.builder()
			.sessionId("test-session-id")
			.userEmail("test@example.com")
			.userName("테스트 사용자")
			.build();

		ChatSessionEntity mockEntity = ChatSessionEntity.builder()
			.sessionId("test-session-id")
			.userEmail("test@example.com")
			.userName("테스트 사용자")
			.createdAt(LocalDateTime.now())
			.build();

		ChatSessionEntity savedEntity = ChatSessionEntity.builder()
			.sessionId("test-session-id")
			.userEmail("test@example.com")
			.userName("테스트 사용자")
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();

		when(chatMapper.toEntity(request)).thenReturn(mockEntity);
		when(chatSessionRepository.save(mockEntity)).thenReturn(savedEntity);

		// When
		ChatSessionEntity result = chatService.saveSession(request);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getSessionId()).isEqualTo("test-session-id");
		assertThat(result.getUserEmail()).isEqualTo("test@example.com");
		assertThat(result.getUserName()).isEqualTo("테스트 사용자");

		verify(chatMapper).toEntity(request);
		verify(chatSessionRepository).save(mockEntity);
	}

	@Test
	@DisplayName("분석 결과 저장 테스트")
	void saveAnalysis_Success() {
		// Given
		Map<String, Object> payload = Map.of(
			"session_id", "test-session-id",
			"user_email", "test@example.com",
			"user_name", "테스트 사용자",
			"summary", "상담 요약",
			"emotions", "{\"joy\": 0.3, \"sadness\": 0.7}",
			"risk_factors", "우울 증상",
			"primary_risk", "중간",
			"protective_factors", "가족 지지"
		);

		ChatSessionEntity mockEntity = ChatSessionEntity.builder()
			.sessionId("test-session-id")
			.userEmail("test@example.com")
			.userName("테스트 사용자")
			.summary("상담 요약")
			.emotions("{\"joy\": 0.3, \"sadness\": 0.7}")
			.primaryRisk("우울 증상")
			.riskFactors("중간")
			.protectiveFactors("가족 지지")
			.build();

		ChatSessionEntity savedEntity = ChatSessionEntity.builder()
			.sessionId("test-session-id")
			.userEmail("test@example.com")
			.userName("테스트 사용자")
			.summary("상담 요약")
			.emotions("{\"joy\": 0.3, \"sadness\": 0.7}")
			.primaryRisk("우울 증상")
			.riskFactors("중간")
			.protectiveFactors("가족 지지")
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();

		when(chatMapper.toAnalysisEntity(payload)).thenReturn(mockEntity);
		when(chatSessionRepository.save(mockEntity)).thenReturn(savedEntity);

		// When
		ChatSessionEntity result = chatService.saveAnalysis(payload);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getSessionId()).isEqualTo("test-session-id");
		assertThat(result.getSummary()).isEqualTo("상담 요약");
		assertThat(result.getEmotions()).contains("joy");

		verify(chatMapper).toAnalysisEntity(payload);
		verify(chatSessionRepository).save(mockEntity);
	}

	@Test
	@DisplayName("세션 업데이트 성공 테스트")
	void updateSession_Success() {
		// Given
		String sessionId = "test-session-id";
		SessionRequest request = SessionRequest.builder()
			.sessionId(sessionId)
			.userEmail("test@example.com")
			.userName("업데이트된 사용자")
			.summary("업데이트된 요약")
			.build();

		ChatSessionEntity existingEntity = ChatSessionEntity.builder()
			.sessionId(sessionId)
			.userEmail("test@example.com")
			.userName("기존 사용자")
			.summary("기존 요약")
			.createdAt(LocalDateTime.now().minusHours(1))
			.build();

		ChatSessionEntity updatedEntity = ChatSessionEntity.builder()
			.sessionId(sessionId)
			.userEmail("test@example.com")
			.userName("업데이트된 사용자")
			.summary("업데이트된 요약")
			.createdAt(LocalDateTime.now().minusHours(1))
			.updatedAt(LocalDateTime.now())
			.build();

		when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(existingEntity));
		when(chatSessionRepository.save(existingEntity)).thenReturn(updatedEntity);

		// When
		ChatSessionEntity result = chatService.updateSession(sessionId, request);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getSessionId()).isEqualTo(sessionId);
		assertThat(result.getUserName()).isEqualTo("업데이트된 사용자");
		assertThat(result.getSummary()).isEqualTo("업데이트된 요약");

		verify(chatSessionRepository).findById(sessionId);
		verify(chatMapper).updateEntity(existingEntity, request);
		verify(chatSessionRepository).save(existingEntity);
	}

	@Test
	@DisplayName("세션 업데이트 - 세션 없음 예외 테스트")
	void updateSession_SessionNotFound_ThrowsException() {
		// Given
		String sessionId = "non-existent-session";
		SessionRequest request = SessionRequest.builder()
			.sessionId(sessionId)
			.userEmail("test@example.com")
			.build();

		when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

		// When & Then
		assertThatThrownBy(() -> chatService.updateSession(sessionId, request))
			.isInstanceOf(NotFoundException.class)
			.hasMessageContaining("Session not found with ID: " + sessionId);

		verify(chatSessionRepository).findById(sessionId);
	}

	// === 조회 관련 테스트 ===

	@Test
	@DisplayName("이메일과 이름으로 세션 조회 테스트")
	void getSessionsByEmailAndName_Success() {
		// Given
		String userEmail = "test@example.com";
		String userName = "테스트 사용자";

		List<ChatSessionEntity> mockSessions = List.of(
			ChatSessionEntity.builder()
				.sessionId("session-1")
				.userEmail(userEmail)
				.userName(userName)
				.summary("첫 번째 상담")
				.createdAt(LocalDateTime.now().minusDays(2))
				.build(),
			ChatSessionEntity.builder()
				.sessionId("session-2")
				.userEmail(userEmail)
				.userName(userName)
				.summary("두 번째 상담")
				.createdAt(LocalDateTime.now().minusDays(1))
				.build()
		);

		when(chatSessionRepository.findAllByUserEmailAndUserNameOrderBySessionIdDesc(userEmail, userName))
			.thenReturn(mockSessions);

		// When
		List<ChatSessionEntity> result = chatService.getSessionsByEmailAndName(userEmail, userName);

		// Then
		assertThat(result).hasSize(2);
		assertThat(result.get(0).getSessionId()).isEqualTo("session-1");
		assertThat(result.get(1).getSessionId()).isEqualTo("session-2");

		verify(chatSessionRepository).findAllByUserEmailAndUserNameOrderBySessionIdDesc(userEmail, userName);
	}

	@Test
	@DisplayName("세션 ID로 세션 조회 성공 테스트")
	void getSessionById_Success() {
		// Given
		String sessionId = "test-session-id";
		ChatSessionEntity mockSession = ChatSessionEntity.builder()
			.sessionId(sessionId)
			.userEmail("test@example.com")
			.userName("테스트 사용자")
			.summary("테스트 상담")
			.createdAt(LocalDateTime.now())
			.build();

		when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(mockSession));

		// When
		Optional<ChatSessionEntity> result = chatService.getSessionById(sessionId);

		// Then
		assertThat(result).isPresent();
		assertThat(result.get().getSessionId()).isEqualTo(sessionId);
		assertThat(result.get().getUserEmail()).isEqualTo("test@example.com");

		verify(chatSessionRepository).findById(sessionId);
	}

	@Test
	@DisplayName("세션 ID로 세션 조회 - 없는 세션")
	void getSessionById_NotFound() {
		// Given
		String sessionId = "non-existent-session";
		when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.empty());

		// When
		Optional<ChatSessionEntity> result = chatService.getSessionById(sessionId);

		// Then
		assertThat(result).isEmpty();
		verify(chatSessionRepository).findById(sessionId);
	}

	// === 상태 관련 테스트 ===

	@Test
	@DisplayName("사용자 이메일로 세션 조회 테스트")
	void getChatSessionsByUserEmail_Success() {
		// Given
		String userEmail = "test@example.com";

		List<ChatSessionEntity> mockEntities = List.of(
			ChatSessionEntity.builder()
				.sessionId("session-1")
				.userEmail(userEmail)
				.userName("테스트 사용자")
				.summary("첫 번째 상담")
				.emotions("{\"joy\": 0.3}")
				.createdAt(LocalDateTime.now().minusDays(1))
				.build(),
			ChatSessionEntity.builder()
				.sessionId("session-2")
				.userEmail(userEmail)
				.userName("테스트 사용자")
				.summary("두 번째 상담")
				.emotions("{\"sadness\": 0.7}")
				.createdAt(LocalDateTime.now())
				.build()
		);

		List<ChatSessionDto> mockDtos = List.of(
			new ChatSessionDto("session-1", userEmail, "테스트 사용자", "첫 번째 상담",
				Map.of("joy", 0.3), null, null, null,
				LocalDateTime.now().minusDays(1), null),
			new ChatSessionDto("session-2", userEmail, "테스트 사용자", "두 번째 상담",
				Map.of("sadness", 0.7), null, null, null,
				LocalDateTime.now(), null)
		);

		when(chatSessionRepository.findByUserEmailOrderByCreatedAtDesc(userEmail)).thenReturn(mockEntities);
		when(chatMapper.toDto(mockEntities.get(0))).thenReturn(mockDtos.get(0));
		when(chatMapper.toDto(mockEntities.get(1))).thenReturn(mockDtos.get(1));

		// When
		List<ChatSessionDto> result = chatService.getChatSessionsByUserEmail(userEmail);

		// Then
		assertThat(result).hasSize(2);
		assertThat(result.get(0).sessionId()).isEqualTo("session-1");
		assertThat(result.get(1).sessionId()).isEqualTo("session-2");
		assertThat(result.get(0).summary()).isEqualTo("첫 번째 상담");
		assertThat(result.get(1).summary()).isEqualTo("두 번째 상담");

		verify(chatSessionRepository).findByUserEmailOrderByCreatedAtDesc(userEmail);
	}

	@Test
	@DisplayName("사용자 이메일로 세션 조회 - 빈 결과")
	void getChatSessionsByUserEmail_EmptyResult() {
		// Given
		String userEmail = "nonexistent@example.com";
		when(chatSessionRepository.findByUserEmailOrderByCreatedAtDesc(userEmail)).thenReturn(List.of());

		// When
		List<ChatSessionDto> result = chatService.getChatSessionsByUserEmail(userEmail);

		// Then
		assertThat(result).isEmpty();
		verify(chatSessionRepository).findByUserEmailOrderByCreatedAtDesc(userEmail);
	}
}
