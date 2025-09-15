// service/impl/EmotionServiceImpl.java
package com.example.backend.service.impl;

import com.example.backend.entity.EmotionEntity;
import com.example.backend.repository.EmotionRepository;
import com.example.backend.service.EmotionService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class EmotionServiceImpl implements EmotionService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();
    private final EmotionRepository emotionRepository;

    public EmotionServiceImpl(EmotionRepository emotionRepository) {
        this.emotionRepository = emotionRepository;
    }

    @Override
    public Map<String, Integer> analyzeText(String email, String text) {
        // === 프롬프트 ===
        String prompt = String.format(
                "다음 문장을 감정별 비율(%%)로 분석해줘.\n" +
                "감정 카테고리: 행복, 슬픔, 분노, 불안, 평온, 기타\n" +
                "문장: \"%s\"\n\n" +
                "반드시 총합이 100이 되도록 하고,\n" +
                "아무 설명·코드블럭 없이 JSON만 출력:\n" +
                "{\"happiness\": 40, \"sadness\": 20, \"anger\": 10, \"anxiety\": 10, \"calmness\": 20, \"etc\": 0}",
                text
        );

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o-mini");
        body.put("messages", List.of(Map.of("role", "user", "content", prompt)));
        body.put("temperature", 0.3);
        body.put("max_tokens", 200);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                requestEntity,
                Map.class
        );

        Map<String, Object> result = response.getBody();
        if (result == null) throw new RuntimeException("OpenAI 응답 없음");

        String content = Optional.ofNullable(
                ((Map) ((Map) ((List) result.get("choices")).get(0)).get("message")).get("content")
        ).map(Object::toString).orElseThrow(() -> new RuntimeException("응답 파싱 실패"));

        Map<String, Integer> emotions = parseEmotionJsonLoose(content);

        // === DB 저장 ===
        EmotionEntity entity = EmotionEntity.builder()
                .email(email)
                .inputText(text)
                .happiness(emotions.getOrDefault("happiness", 0))
                .sadness(emotions.getOrDefault("sadness", 0))
                .anger(emotions.getOrDefault("anger", 0))
                .anxiety(emotions.getOrDefault("anxiety", 0))
                .calmness(emotions.getOrDefault("calmness", 0))
                .etc(emotions.getOrDefault("etc", 0))
                .createdAt(LocalDateTime.now())
                .build();

        emotionRepository.save(entity);

        return emotions;
    }

    private Map<String, Integer> parseEmotionJsonLoose(String raw) {
        try {
            String s = raw.replace("%", "").replace("'", "\"");
            Map<String, Object> obj = mapper.readValue(s, new TypeReference<>() {});
            List<String> keys = List.of("happiness", "sadness", "anger", "anxiety", "calmness", "etc");

            Map<String, Integer> out = new LinkedHashMap<>();
            int sum = 0;
            for (String k : keys) {
                int v = 0;
                if (obj.containsKey(k)) {
                    try {
                        v = (int) Math.round(Double.parseDouble(obj.get(k).toString().trim()));
                    } catch (Exception ignore) {}
                }
                out.put(k, v);
                sum += v;
            }

            if (sum <= 0) throw new RuntimeException("모든 감정 값이 0");

            if (sum != 100) {
                Map<String, Integer> normalized = new LinkedHashMap<>();
                int newSum = 0;
                for (String k : keys) {
                    int v = Math.round(out.get(k) * 100f / sum);
                    normalized.put(k, v);
                    newSum += v;
                }
                int fix = 100 - newSum;
                if (fix != 0) {
                    String maxKey = keys.stream().max(Comparator.comparingInt(normalized::get)).orElse("happiness");
                    normalized.put(maxKey, normalized.get(maxKey) + fix);
                }
                return normalized;
            }
            return out;

        } catch (Exception e) {
            throw new RuntimeException("JSON 파싱 실패", e);
        }
    }
}
