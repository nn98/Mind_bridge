// EmotionParser는 원래 코드 그대로 사용
package com.example.backend.common.util;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class EmotionParser {

	private static final Pattern EMOTION_PATTERN = Pattern.compile("([가-힣]+):\\s*(\\d+(?:\\.\\d+)?)%");

	public Map<String, Double> parse(String emotionString) {
		Map<String, Double> emotionMap = new HashMap<>();
		if (emotionString == null || emotionString.trim().isEmpty()) {
			return emotionMap;
		}
		try {
			Matcher matcher = EMOTION_PATTERN.matcher(emotionString);
			while (matcher.find()) {
				String emotion = matcher.group(1).trim();
				double percent = Double.parseDouble(matcher.group(2));
				if (percent >= 0 && percent <= 100) {
					emotionMap.put(emotion, percent);
				}
			}
		} catch (Exception e) {
			log.warn("감정 파싱 실패: {}", emotionString, e);
		}
		return emotionMap;
	}

	public String format(Map<String, Double> emotions) {
		if (emotions == null || emotions.isEmpty()) {
			return "";
		}
		return emotions.entrySet().stream()
			.map(e -> String.format("%s: %.1f%%", e.getKey(), e.getValue()))
			.reduce((a, b) -> a + ", " + b)
			.orElse("");
	}
}
