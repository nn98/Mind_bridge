package com.example.backend.mapper;

import java.util.Map;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;

import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.dto.chat.SessionHistory;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;

/**
 * Chat 관련 DTO-Entity 매퍼
 */
@Mapper(componentModel = "spring")
public interface ChatMapper {

	ChatMapper INSTANCE = Mappers.getMapper(ChatMapper.class);

	// === DTO to Entity 매핑 ===

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	ChatMessageEntity toEntity(ChatMessageRequest request);

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	ChatSessionEntity toEntity(SessionRequest request);

	// === Entity to DTO 매핑 ===

	SessionHistory toSessionHistory(ChatSessionEntity entity);

	ChatMessageRequest toChatMessageRequest(ChatMessageEntity entity);

	// === Map to Entity 매핑 (분석 결과용) ===

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	@Mapping(target = "userEmail", source = "email")
	@Mapping(target = "userName", source = "name")
	@Mapping(target = "riskFactors", expression = "java(mapToString(payload.get(\"riskFactors\")))")
	@Mapping(target = "protectiveFactors", expression = "java(mapToString(payload.get(\"protectiveFactors\")))")
	@Mapping(target = "summaryEmotion", source = "clientEmotion")
	ChatSessionEntity toAnalysisEntity(Map<String, Object> payload);

	// === 업데이트 매핑 ===

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	void updateEntity(@MappingTarget ChatSessionEntity entity, SessionRequest request);

	// === 헬퍼 메서드 ===

	default String mapToString(Object obj) {
		return obj != null ? obj.toString() : "";
	}
}
