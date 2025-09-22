package com.example.backend.dto.chat;

import java.time.LocalDateTime;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "채팅 세션 정보")
public record ChatSessionDto(
	@Schema(description = "세션 ID")
	String sessionId,

	@Schema(description = "사용자 이메일")
	String userEmail,

	@Schema(description = "사용자 이름")
	String userName,

	@Schema(description = "세션 요약")
	String summary,

	@Schema(description = "감정 분포 (감정명 -> 퍼센트)")
	Map<String, Double> emotions,

	@Schema(description = "주요 위험 요소")
	String primaryRisk,

	@Schema(description = "보호 요인")
	String protectiveFactors,

	@Schema(description = "위험 요인", defaultValue = "0")
	String riskFactors,

	@Schema(description = "생성일시")
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	LocalDateTime createdAt,

	@Schema(description = "수정일시")
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	LocalDateTime updatedAt
) {
	// 컴팩트 생성자에서 검증
	public ChatSessionDto {
		if (emotions == null) {
			emotions = Map.of();
		}
	}

	// 편의 메서드
	public double getTotalEmotionScore() {
		return emotions.values().stream()
			.mapToDouble(Double::doubleValue)
			.sum();
	}
}
