package com.example.backend.dto.chat;

import java.time.LocalDateTime;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "채팅 메시지 정보")
public record ChatMessageDto(
	@Schema(description = "메시지 ID", example = "1")
	Long messageId,

	@Schema(description = "세션 ID", example = "d6af5dd5-e308-4e89-afe3-60d7e6652afd")
	String sessionId,

	@Schema(description = "메시지 타입", allowableValues = {"USER", "AI"})
	ChatMessageType messageType,

	@Schema(description = "메시지 내용", example = "안녕하세요, 상담을 받고 싶습니다.")
	String messageContent,

	@Schema(description = "감정 분석 결과 (JSON 형태)",
		example = "{\"joy\": 0.3, \"sadness\": 0.7}")
	String emotion,

	@Schema(description = "사용자 이메일", example = "user@example.com")
	String userEmail,

	@Schema(description = "채팅 스타일", example = "empathetic")
	String chatStyle,

	@Schema(description = "생성일시")
	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	LocalDateTime createdAt
) {
	// 정적 ObjectMapper 인스턴스
	@JsonIgnore
	private static final ObjectMapper MAPPER = new ObjectMapper();

	// 컴팩트 생성자에서 검증 및 정규화
	public ChatMessageDto {
		// 필수 필드 검증
		if (sessionId == null || sessionId.isBlank()) {
			throw new IllegalArgumentException("세션 ID는 필수입니다.");
		}
		if (messageType == null) {
			throw new IllegalArgumentException("메시지 타입은 필수입니다.");
		}

		// 기본값 설정 및 정규화
		if (chatStyle == null || chatStyle.isBlank()) {
			chatStyle = "default";
		}
		if (messageContent != null) {
			messageContent = messageContent.trim();
		}
		if (emotion != null && emotion.isBlank()) {
			emotion = null; // 빈 문자열을 null로 정규화
		}
	}

	// === 편의 메서드들 ===

	/**
	 * 감정 분석 결과를 Map으로 변환
	 */
	@JsonIgnore
	public Map<String, Double> getEmotionAsMap() {
		if (emotion == null || emotion.isBlank()) {
			return Map.of();
		}

		try {
			return MAPPER.readValue(emotion, new TypeReference<Map<String, Double>>() {});
		} catch (JsonProcessingException e) {
			return Map.of();
		}
	}

	/**
	 * 주요 감정 추출 (가장 높은 점수의 감정)
	 */
	@JsonIgnore
	public String getPrimaryEmotion() {
		Map<String, Double> emotions = getEmotionAsMap();
		return emotions.entrySet().stream()
			.max(Map.Entry.comparingByValue())
			.map(Map.Entry::getKey)
			.orElse("neutral");
	}

	/**
	 * 감정 점수 합계
	 */
	@JsonIgnore
	public double getTotalEmotionScore() {
		return getEmotionAsMap().values().stream()
			.mapToDouble(Double::doubleValue)
			.sum();
	}

	// 메시지 타입 확인 편의 메서드들
	public boolean isUserMessage() {
		return ChatMessageType.USER.equals(messageType);
	}

	public boolean isAiMessage() {
		return ChatMessageType.AI.equals(messageType);
	}

	// 메시지 내용 관련 편의 메서드들
	public int getContentLength() {
		return messageContent != null ? messageContent.length() : 0;
	}

	public boolean isEmpty() {
		return messageContent == null || messageContent.trim().isEmpty();
	}

	public boolean hasEmotion() {
		return emotion != null && !emotion.trim().isEmpty();
	}

	public boolean isContentTooLong(int maxLength) {
		return getContentLength() > maxLength;
	}

	// 사용자 및 세션 관련 편의 메서드들
	public boolean belongsToUser(String email) {
		return userEmail != null && userEmail.equals(email);
	}

	public boolean belongsToSession(String sessionIdToCheck) {
		return sessionId != null && sessionId.equals(sessionIdToCheck);
	}

	/**
	 * 메시지 요약 (긴 내용일 경우 잘라서 표시)
	 */
	@JsonIgnore
	public String getContentSummary(int maxLength) {
		if (messageContent == null) return "";
		if (messageContent.length() <= maxLength) return messageContent;
		return messageContent.substring(0, maxLength) + "...";
	}

	/**
	 * 디버깅용 문자열 표현
	 */
	@Override
	public String toString() {
		return String.format("ChatMessage[id=%d, type=%s, session=%s, user=%s, contentLength=%d]",
			messageId, messageType, sessionId, userEmail, getContentLength());
	}
}
