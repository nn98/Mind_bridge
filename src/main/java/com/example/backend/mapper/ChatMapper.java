package com.example.backend.mapper;

import java.util.Map;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;

@Mapper(
	componentModel = "spring",
	unmappedTargetPolicy = ReportingPolicy.ERROR, // 누락 즉시 발견
	nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface ChatMapper {

	// 1) ChatMessage: DB가 PK/시간 채움
	@Mapping(target = "messageId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	ChatMessageEntity toEntity(ChatMessageRequest request);

	// 2) ChatSession: 요청 → 엔티티 (sessionId는 서버에서 UUID 생성)
	@Mapping(target = "sessionId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	@Mapping(target = "userEmail", source = "userEmail")
	@Mapping(target = "userName",  source = "userName")
	@Mapping(target = "summary",   source = "summary")
	@Mapping(target = "emotions",  source = "emotions")
	@Mapping(target = "primaryRisk", source = "primaryRisk")
	@Mapping(target = "riskFactors", source = "riskFactors")
	@Mapping(target = "protectiveFactors", source = "protectiveFactors")
	ChatSessionEntity toEntity(SessionRequest request);

	// 3) 분석 Map → 엔티티: 키마다 명시적 캐스팅
	@Mapping(target = "sessionId", ignore = true)
	@Mapping(target = "userEmail",          expression = "java(toStr(payload.get(\"user_email\")))")
	@Mapping(target = "userName",           expression = "java(toStr(payload.get(\"user_name\")))")
	@Mapping(target = "summary",            expression = "java(toStr(payload.get(\"summary\")))")
	@Mapping(target = "emotions",           expression = "java(toStr(payload.get(\"emotions\")))")
	@Mapping(target = "primaryRisk",        expression = "java(toStr(payload.get(\"primary_risk\")))")
	@Mapping(target = "riskFactors",        expression = "java(toStr(payload.get(\"risk_factors\")))")
	@Mapping(target = "protectiveFactors",  expression = "java(toStr(payload.get(\"protective_factors\")))")
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	ChatSessionEntity toAnalysisEntity(Map<String, Object> payload);

	// 4) 부분 업데이트: 허용 필드만 지정(누락 경고 회피)
	@BeanMapping(ignoreByDefault = true)
	@Mapping(target = "userName",  source = "userName")
	@Mapping(target = "summary",   source = "summary")
	@Mapping(target = "emotions",  source = "emotions")
	@Mapping(target = "primaryRisk", source = "primaryRisk")
	@Mapping(target = "riskFactors", source = "riskFactors")
	@Mapping(target = "protectiveFactors", source = "protectiveFactors")
	void updateEntity(@MappingTarget ChatSessionEntity entity, SessionRequest request);

	// 헬퍼: 모호성 방지를 위해 단 하나만 제공
	default String toStr(Object v) { return v == null ? null : v.toString(); }
}
