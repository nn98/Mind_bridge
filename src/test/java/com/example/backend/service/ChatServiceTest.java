package com.example.backend.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.chat.ChatMessageDto;
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
@DisplayName("ChatService 테스트")
class ChatServiceTest {

	@Mock
	private ChatMessageRepository chatMessageRepository;

	@Mock
	private ChatSessionRepository chatSessionRepository;

	@Mock
	private ChatMapper chatMapper;

	@InjectMocks
	private ChatService chatService;

	// 테스트용 데이터
	private ChatSessionEntity testSession;
	private ChatMessageEntity testUserMessage;
	private ChatMessageEntity testAiMessage;
	private SessionRequest testSessionRequest;
	private ChatMessageRequest testMessageRequest;
	private ChatSessionDto testSessionDto;
	private ChatMessageDto testMessageDto;

	@BeforeEach
	void setUp() {
		// ChatSessionEntity 테스트 데이터
		testSession = ChatSessionEntity.builder()
			.sessionId("test-session-id")
			.userEmail("test@example.com")
			.userName("테스트 사용자")
			.summary("테스트 상담")
			.emotions("{\"joy\": 0.3, \"sadness\": 0.7}")
			.primaryRisk("중간")
			.riskFactors("우울 증상")
			.protectiveFactors("가족 지지")
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();

		// ChatMessageEntity 테스트 데이터
		testUserMessage = ChatMessageEntity.builder()
			.messageId(1L)
			.sessionId("test-session-id")
			.messageType(ChatMessageType.USER)
			.messageContent("안녕하세요")
			.userEmail("test@example.com")
			.chatStyle("default")
			.createdAt(LocalDateTime.now().minusMinutes(5))
			.build();

		testAiMessage = ChatMessageEntity.builder()
			.messageId(2L)
			.sessionId("test-session-id")
			.messageType(ChatMessageType.AI)
			.messageContent("안녕하세요! 무엇을 도와드릴까요?")
			.emotion("{\"joy\": 0.9}")
			.userEmail("test@example.com")
			.chatStyle("empathetic")
			.createdAt(LocalDateTime.now())
			.build();

		// Request DTO 테스트 데이터
		testSessionRequest = SessionRequest.builder()
			.sessionId("test-session-id")
			.userEmail("test@example.com")
			.userName("테스트 사용자")
			.summary("테스트 상담")
			.build();

		testMessageRequest = ChatMessageRequest.builder()
			.sessionId("test-session-id")
			.messageType(ChatMessageType.USER)
			.messageContent("안녕하세요")
			.userEmail("test@example.com")
			.chatStyle("default")
			.build();

		// Response DTO 테스트 데이터
		testSessionDto = new ChatSessionDto(
			"test-session-id",
			"test@example.com",
			"테스트 사용자",
			"테스트 상담",
			Map.of("joy", 0.3, "sadness", 0.7),
			"중간",
			"가족 지지",
			"우울 증상",
			LocalDateTime.now(),
			LocalDateTime.now()
		);

		testMessageDto = new ChatMessageDto(
			1L,
			"test-session-id",
			ChatMessageType.USER,
			"안녕하세요",
			null,
			"test@example.com",
			"default",
			LocalDateTime.now()
		);
	}

	// === 메시지 관련 테스트 ===

	@Test
	@DisplayName("메시지 저장 성공 테스트")
	void saveMessage_Success() {
		// Given
		when(chatMapper.toEntity(testMessageRequest)).thenReturn(testUserMessage);
		when(chatMessageRepository.save(testUserMessage)).thenReturn(testUserMessage);

		// When
		ChatMessageEntity result = chatService.saveMessage(testMessageRequest);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getMessageId()).isEqualTo(1L);
		assertThat(result.getSessionId()).isEqualTo("test-session-id");
		assertThat(result.getMessageType()).isEqualTo(ChatMessageType.USER);
		assertThat(result.getMessageContent()).isEqualTo("안녕하세요");

		verify(chatMapper).toEntity(testMessageRequest);
		verify(chatMessageRepository).save(testUserMessage);
	}

	@Test
	@DisplayName("세션별 메시지 조회 테스트 - 기존 메서드")
	void getMessagesBySessionId_Success() {
		// Given
		String sessionId = "test-session-id";
		List<ChatMessageEntity> mockMessages = List.of(testUserMessage, testAiMessage);

		// ✅ 올바른 Repository 메서드 Mock
		when(chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId))
			.thenReturn(mockMessages);

		// When
		List<ChatMessageEntity> result = chatService.getMessagesBySessionId(sessionId);

		// Then
		assertThat(result).hasSize(2);
		assertThat(result.get(0).getMessageType()).isEqualTo(ChatMessageType.USER);
		assertThat(result.get(1).getMessageType()).isEqualTo(ChatMessageType.AI);

		verify(chatMessageRepository).findBySessionIdOrderByCreatedAtAsc(sessionId);
	}

	@Test
	@DisplayName("세션별 메시지 조회 테스트 - 권한 확인")
	void getMessagesBySessionId_WithAuth_Success() {
		// Given
		String sessionId = "test-session-id";
		String userEmail = "test@example.com";
		List<ChatMessageEntity> mockMessages = List.of(testUserMessage, testAiMessage);
		List<ChatMessageDto> mockDtos = List.of(testMessageDto);

		// ✅ 권한 확인 Mock
		when(chatSessionRepository.existsBySessionIdAndUserEmail(sessionId, userEmail))
			.thenReturn(true);

		// ✅ 메시지 조회 Mock
		when(chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId))
			.thenReturn(mockMessages);

		// ✅ Mapper Mock
		when(chatMapper.toMessageDtoList(mockMessages))
			.thenReturn(mockDtos);

		// When
		List<ChatMessageDto> result = chatService.getMessagesBySessionId(sessionId, userEmail);

		// Then
		assertThat(result).hasSize(1);

		verify(chatSessionRepository).existsBySessionIdAndUserEmail(sessionId, userEmail);
		verify(chatMessageRepository).findBySessionIdOrderByCreatedAtAsc(sessionId);
		verify(chatMapper).toMessageDtoList(mockMessages);
	}

	// === 세션 관련 테스트 ===

	@Test
	@DisplayName("세션 저장 성공 테스트")
	void saveSession_Success() {
		// Given
		when(chatMapper.toEntity(testSessionRequest)).thenReturn(testSession);
		when(chatSessionRepository.save(testSession)).thenReturn(testSession);

		// When
		ChatSessionEntity result = chatService.saveSession(testSessionRequest);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getSessionId()).isEqualTo("test-session-id");
		assertThat(result.getUserEmail()).isEqualTo("test@example.com");
		assertThat(result.getUserName()).isEqualTo("테스트 사용자");

		verify(chatMapper).toEntity(testSessionRequest);
		verify(chatSessionRepository).save(testSession);
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

		when(chatMapper.toAnalysisEntity(payload)).thenReturn(testSession);
		when(chatSessionRepository.save(testSession)).thenReturn(testSession);

		// When
		ChatSessionEntity result = chatService.saveAnalysis(payload);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getSessionId()).isEqualTo("test-session-id");
		assertThat(result.getSummary()).isEqualTo("테스트 상담");

		verify(chatMapper).toAnalysisEntity(payload);
		verify(chatSessionRepository).save(testSession);
	}

	@Test
	@DisplayName("세션 업데이트 성공 테스트")
	void updateSession_Success() {
		// Given
		String sessionId = "test-session-id";

		when(chatSessionRepository.findBySessionId(sessionId))
			.thenReturn(Optional.of(testSession));
		when(chatSessionRepository.save(testSession)).thenReturn(testSession);

		// When
		ChatSessionEntity result = chatService.updateSession(sessionId, testSessionRequest);

		// Then
		assertThat(result).isNotNull();
		assertThat(result.getSessionId()).isEqualTo(sessionId);

		verify(chatSessionRepository).findBySessionId(sessionId);
		verify(chatMapper).updateEntity(testSession, testSessionRequest);
		verify(chatSessionRepository).save(testSession);
	}

	@Test
	@DisplayName("세션 업데이트 - 세션 없음 예외 테스트")
	void updateSession_SessionNotFound_ThrowsException() {
		// Given
		String sessionId = "non-existent-session";

		when(chatSessionRepository.findBySessionId(sessionId))
			.thenReturn(Optional.empty());

		// When & Then
		assertThatThrownBy(() -> chatService.updateSession(sessionId, testSessionRequest))
			.isInstanceOf(NotFoundException.class)
			.hasMessageContaining("세션을 찾을 수 없습니다: " + sessionId);

		verify(chatSessionRepository).findBySessionId(sessionId);
	}

	// === 조회 관련 테스트 ===

	@Test
	@DisplayName("이메일과 이름으로 세션 조회 테스트")
	void getSessionsByEmailAndName_Success() {
		// Given
		String userEmail = "test@example.com";
		String userName = "테스트 사용자";
		List<ChatSessionEntity> mockSessions = List.of(testSession);

		when(chatSessionRepository.findAllByUserEmailAndUserNameOrderBySessionIdDesc(userEmail, userName))
			.thenReturn(mockSessions);

		// When
		List<ChatSessionEntity> result = chatService.getSessionsByEmailAndName(userEmail, userName);

		// Then
		assertThat(result).hasSize(1);
		assertThat(result.get(0).getSessionId()).isEqualTo("test-session-id");

		verify(chatSessionRepository).findAllByUserEmailAndUserNameOrderBySessionIdDesc(userEmail, userName);
	}

	@Test
	@DisplayName("세션 ID로 세션 조회 성공 테스트")
	void getSessionById_Success() {
		// Given
		String sessionId = "test-session-id";

		when(chatSessionRepository.findBySessionId(sessionId))
			.thenReturn(Optional.of(testSession));
		// ✅ Mapper Mock 추가 (DTO 반환이므로 필수)
		when(chatMapper.toDto(testSession))
			.thenReturn(testSessionDto);

		// When
		Optional<ChatSessionDto> result = chatService.getSessionById(sessionId);

		// Then
		assertThat(result).isPresent();
		assertThat(result.get().sessionId()).isEqualTo(sessionId);

		verify(chatSessionRepository).findBySessionId(sessionId);
		verify(chatMapper).toDto(testSession); // ✅ Mapper 호출 검증
	}

	@Test
	@DisplayName("세션 ID로 세션 조회 성공 테스트 - Entity용")
	void getSessionByIdEntity_Success() {
		// Given
		String sessionId = "test-session-id";

		when(chatSessionRepository.findBySessionId(sessionId))
			.thenReturn(Optional.of(testSession));

		// When - ✅ Entity 반환 메서드 호출
		Optional<ChatSessionEntity> result = chatService.getSessionByIdEntity(sessionId);

		// Then
		assertThat(result).isPresent();
		assertThat(result.get().getSessionId()).isEqualTo(sessionId);

		verify(chatSessionRepository).findBySessionId(sessionId);
	}

	@Test
	@DisplayName("세션 ID로 세션 조회 - 없는 세션")
	void getSessionById_NotFound() {
		// Given
		String sessionId = "non-existent-session";

		when(chatSessionRepository.findBySessionId(sessionId))
			.thenReturn(Optional.empty());

		// When
		Optional<ChatSessionDto> result = chatService.getSessionById(sessionId);

		// Then
		assertThat(result).isEmpty();

		verify(chatSessionRepository).findBySessionId(sessionId);
	}

	// === 상태 관련 테스트 ===

	@Test
	@DisplayName("사용자 이메일로 세션 조회 테스트")
	void getChatSessionsByUserEmail_Success() {
		// Given
		String userEmail = "test@example.com";
		List<ChatSessionEntity> mockEntities = List.of(testSession);
		List<ChatSessionDto> mockDtos = List.of(testSessionDto);

		// ✅ Repository Mock 설정
		when(chatSessionRepository.findByUserEmailOrderByCreatedAtDesc(userEmail))
			.thenReturn(mockEntities);

		// ✅ Mapper Mock 설정
		when(chatMapper.toSessionDtoList(mockEntities))
			.thenReturn(mockDtos);

		// When
		List<ChatSessionDto> result = chatService.getChatSessionsByUserEmail(userEmail);

		// Then
		assertThat(result).hasSize(1);
		assertThat(result.get(0).sessionId()).isEqualTo("test-session-id");
		assertThat(result.get(0).userEmail()).isEqualTo(userEmail);

		verify(chatSessionRepository).findByUserEmailOrderByCreatedAtDesc(userEmail);
		verify(chatMapper).toSessionDtoList(mockEntities);
	}

	@Test
	@DisplayName("사용자 이메일로 세션 조회 - 빈 결과")
	void getChatSessionsByUserEmail_EmptyResult() {
		// Given
		String userEmail = "nonexistent@example.com";

		when(chatSessionRepository.findByUserEmailOrderByCreatedAtDesc(userEmail))
			.thenReturn(List.of());
		when(chatMapper.toSessionDtoList(List.of()))
			.thenReturn(List.of());

		// When
		List<ChatSessionDto> result = chatService.getChatSessionsByUserEmail(userEmail);

		// Then
		assertThat(result).isEmpty();

		verify(chatSessionRepository).findByUserEmailOrderByCreatedAtDesc(userEmail);
		verify(chatMapper).toSessionDtoList(List.of());
	}

	// === 삭제 관련 테스트 ===

	@Test
	@DisplayName("세션 삭제 성공 테스트")
	void deleteSession_Success() {
		// Given
		String sessionId = "test-session-id";

		when(chatSessionRepository.findBySessionId(sessionId))
			.thenReturn(Optional.of(testSession));

		// When
		chatService.deleteSession(sessionId);

		// Then
		verify(chatSessionRepository).findBySessionId(sessionId);
		verify(chatMessageRepository).deleteAllBySessionId(sessionId);
		verify(chatSessionRepository).delete(testSession);
	}

	@Test
	@DisplayName("세션 삭제 - 세션 없음 예외")
	void deleteSession_SessionNotFound_ThrowsException() {
		// Given
		String sessionId = "non-existent-session";

		when(chatSessionRepository.findBySessionId(sessionId))
			.thenReturn(Optional.empty());

		// When & Then
		assertThatThrownBy(() -> chatService.deleteSession(sessionId))
			.isInstanceOf(NotFoundException.class)
			.hasMessageContaining("세션을 찾을 수 없습니다: " + sessionId);

		verify(chatSessionRepository).findBySessionId(sessionId);
	}
}
