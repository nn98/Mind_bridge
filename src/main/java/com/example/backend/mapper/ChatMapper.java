// ChatMapper - expression 방식으로 단순화
package com.example.backend.mapper;

import java.util.Map;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.backend.common.util.EmotionParser;
import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.dto.chat.ChatSessionDto;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;

/**
 * Chat 관련 DTO-Entity 매퍼
 */
@Mapper(
	componentModel = "spring",
	unmappedTargetPolicy = ReportingPolicy.ERROR,
	nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public abstract class ChatMapper {

	@Autowired
	protected EmotionParser emotionParser;

	// === Entity → DTO 변환 ===

	@Mapping(target = "emotions", expression = "java(emotionParser.parse(entity.getEmotions()))")
	public abstract ChatSessionDto toDto(ChatSessionEntity entity);

	// === DTO → Entity 변환 ===

	@Mapping(target = "sessionId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	@Mapping(target = "emotions", expression = "java(emotionParser.format(dto.emotions()))")
	public abstract ChatSessionEntity toEntity(ChatSessionDto dto);

	// === 요청 → Entity 변환 ===

	@Mapping(target = "messageId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	public abstract ChatMessageEntity toEntity(ChatMessageRequest request);

	@Mapping(target = "sessionId", ignore = false)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	public abstract ChatSessionEntity toEntity(SessionRequest request);

	// === 분석 결과 Map → Entity ===

	@Mapping(target = "sessionId", ignore = true)
	@Mapping(target = "userEmail", expression = "java(toStr(payload.get(\"user_email\")))")
	@Mapping(target = "userName", expression = "java(toStr(payload.get(\"user_name\")))")
	@Mapping(target = "summary", expression = "java(toStr(payload.get(\"summary\")))")
	@Mapping(target = "emotions", expression = "java(toStr(payload.get(\"emotions\")))")
	@Mapping(target = "primaryRisk", expression = "java(toStr(payload.get(\"primary_risk\")))")
	@Mapping(target = "riskFactors", expression = "java(toStr(payload.get(\"risk_factors\")))")
	@Mapping(target = "protectiveFactors", expression = "java(toStr(payload.get(\"protective_factors\")))")
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	public abstract ChatSessionEntity toAnalysisEntity(Map<String, Object> payload);

	// === 부분 업데이트 ===

	@BeanMapping(ignoreByDefault = true)
	@Mapping(target = "userName", source = "userName")
	@Mapping(target = "summary", source = "summary")
	@Mapping(target = "emotions", source = "emotions")
	@Mapping(target = "primaryRisk", source = "primaryRisk")
	@Mapping(target = "riskFactors", source = "riskFactors")
	@Mapping(target = "protectiveFactors", source = "protectiveFactors")
	@Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
	public abstract void updateEntity(@MappingTarget ChatSessionEntity entity, SessionRequest request);

	// === 헬퍼 메서드 ===

	protected String toStr(Object v) {
		return v == null ? null : v.toString();
	}
}
