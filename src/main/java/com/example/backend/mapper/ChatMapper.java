package com.example.backend.mapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.mapstruct.AfterMapping;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.backend.common.util.EmotionParser;
import com.example.backend.dto.chat.ChatMessageDto;
import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.dto.chat.ChatMessageType;
import com.example.backend.dto.chat.ChatSessionDto;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;

/**
 * Chat 관련 DTO-Entity 매퍼
 */
@Mapper(
	componentModel = "spring",
	unmappedTargetPolicy = ReportingPolicy.WARN, // ERROR에서 WARN으로 변경
	nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
	imports = {LocalDateTime.class, ChatMessageType.class}
)
public abstract class ChatMapper {

	@Autowired
	protected EmotionParser emotionParser;

	// === ChatSession Entity → DTO 변환 ===

	@Mapping(target = "emotions", expression = "java(emotionParser.parse(entity.getEmotions()))")
	public abstract ChatSessionDto toDto(ChatSessionEntity entity);

	public abstract List<ChatSessionDto> toSessionDtoList(List<ChatSessionEntity> entities);

	// === ChatSession DTO → Entity 변환 ===

	@Mapping(target = "sessionId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	@Mapping(target = "emotions", expression = "java(emotionParser.format(dto.emotions()))")
	public abstract ChatSessionEntity toEntity(ChatSessionDto dto);

	// === ChatMessage Entity ↔ DTO 변환 ===

	/**
	 * ChatMessageEntity를 ChatMessageDto로 변환
	 */
	public abstract ChatMessageDto toMessageDto(ChatMessageEntity entity);

	/**
	 * ChatMessageDto를 ChatMessageEntity로 변환 (새 엔티티 생성용)
	 */
	@Mapping(target = "messageId", ignore = true) // ID는 자동 생성
	@Mapping(target = "createdAt", ignore = true) // @CreationTimestamp 사용
	public abstract ChatMessageEntity toMessageEntity(ChatMessageDto dto);

	/**
	 * ChatMessage Entity 리스트를 DTO 리스트로 변환
	 */
	public abstract List<ChatMessageDto> toMessageDtoList(List<ChatMessageEntity> entities);

	/**
	 * ChatMessage DTO 리스트를 Entity 리스트로 변환
	 */
	@Mapping(target = "messageId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	public abstract List<ChatMessageEntity> toMessageEntityList(List<ChatMessageDto> dtos);

	// === 요청 → Entity 변환 (기존) ===

	@Mapping(target = "messageId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	public abstract ChatMessageEntity toEntity(ChatMessageRequest request);

	@Mapping(target = "sessionId", ignore = false)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	@Mapping(target = "primaryRisk", expression = "java(toStr(request.getRiskFactors()))")
	@Mapping(target = "riskFactors", expression = "java(toStr(request.getPrimaryRisk()))")
	public abstract ChatSessionEntity toEntity(SessionRequest request);

	// === 간편 메시지 생성 메서드들 ===

	/**
	 * 사용자 메시지 생성
	 */
	@Mapping(target = "messageId", ignore = true)
	@Mapping(target = "messageType", constant = "USER")
	@Mapping(target = "emotion", ignore = true) // 사용자 메시지는 감정 분석 없음
	@Mapping(target = "createdAt", ignore = true)
	public abstract ChatMessageEntity createUserMessage(
		String sessionId,
		String messageContent,
		String userEmail,
		String chatStyle
	);

	/**
	 * AI 응답 메시지 생성
	 */
	@Mapping(target = "messageId", ignore = true)
	@Mapping(target = "messageType", constant = "AI")
	@Mapping(target = "createdAt", ignore = true)
	public abstract ChatMessageEntity createAiMessage(
		String sessionId,
		String messageContent,
		String emotion,
		String userEmail,
		String chatStyle
	);

	// === 분석 결과 Map → Entity (기존) ===

	@Mapping(target = "sessionId", ignore = true)
	@Mapping(target = "userEmail", expression = "java(toStr(payload.get(\"user_email\")))")
	@Mapping(target = "userName", expression = "java(toStr(payload.get(\"user_name\")))")
	@Mapping(target = "summary", expression = "java(toStr(payload.get(\"summary\")))")
	@Mapping(target = "emotions", expression = "java(toStr(payload.get(\"emotions\")))")
	@Mapping(target = "primaryRisk", expression = "java(toStr(payload.get(\"risk_factors\")))")
	@Mapping(target = "riskFactors", expression = "java(toStr(payload.get(\"primary_risk\")))")
	@Mapping(target = "protectiveFactors", expression = "java(toStr(payload.get(\"protective_factors\")))")
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	public abstract ChatSessionEntity toAnalysisEntity(Map<String, Object> payload);

	// === 부분 업데이트 (기존) ===

	@BeanMapping(ignoreByDefault = true)
	@Mapping(target = "userName", source = "userName")
	@Mapping(target = "summary", source = "summary")
	@Mapping(target = "emotions", source = "emotions")
	@Mapping(target = "primaryRisk", source = "primaryRisk")
	@Mapping(target = "riskFactors", source = "riskFactors")
	@Mapping(target = "protectiveFactors", source = "protectiveFactors")
	@Mapping(target = "updatedAt", expression = "java(LocalDateTime.now())")
	public abstract void updateEntity(@MappingTarget ChatSessionEntity entity, SessionRequest request);

	/**
	 * ChatMessage 내용 업데이트 (기존 Entity에 일부 필드만 업데이트)
	 */
	@BeanMapping(ignoreByDefault = true)
	@Mapping(target = "messageContent", source = "messageContent")
	@Mapping(target = "emotion", source = "emotion")
	public abstract void updateMessageContent(
		ChatMessageDto dto,
		@MappingTarget ChatMessageEntity entity
	);

	// === AfterMapping 메서드들 (데이터 정규화) ===

	/**
	 * ChatMessageEntity 생성 후 데이터 정규화
	 */
	@AfterMapping
	protected void normalizeMessageEntity(@MappingTarget ChatMessageEntity entity) {
		// 채팅 스타일 기본값 설정
		if (entity.getChatStyle() == null || entity.getChatStyle().trim().isEmpty()) {
			entity.setChatStyle("default");
		}

		// 메시지 내용 정규화
		if (entity.getMessageContent() != null) {
			entity.setMessageContent(entity.getMessageContent().trim());
			if (entity.getMessageContent().isEmpty()) {
				entity.setMessageContent(null);
			}
		}

		// 감정 데이터 검증 (EmotionParser 사용)
		if (entity.getEmotion() != null && !entity.getEmotion().trim().isEmpty()) {
			try {
				// EmotionParser로 검증
				emotionParser.parse(entity.getEmotion());
			} catch (Exception e) {
				entity.setEmotion(null); // 파싱 실패시 null로 설정
			}
		} else if (entity.getEmotion() != null) {
			entity.setEmotion(null); // 빈 문자열을 null로 정규화
		}
	}

	// === 헬퍼 메서드 (기존) ===

	protected String toStr(Object v) {
		return v == null ? null : v.toString();
	}

	/**
	 * 감정 분석 결과 검증
	 */
	@Named("isValidEmotion")
	protected boolean isValidEmotion(String emotion) {
		if (emotion == null || emotion.trim().isEmpty()) {
			return false;
		}

		try {
			emotionParser.parse(emotion);
			return true;
		} catch (Exception e) {
			return false;
		}
	}
}
