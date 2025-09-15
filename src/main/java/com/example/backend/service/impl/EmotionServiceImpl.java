// src/main/java/com/example/backend/service/impl/EmotionServiceImpl.java
package com.example.backend.service.impl;

import com.example.backend.entity.EmotionEntity;
import com.example.backend.repository.EmotionRepository;
import com.example.backend.service.EmotionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class EmotionServiceImpl implements EmotionService {

    private final EmotionRepository repository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    public EmotionServiceImpl(EmotionRepository repository) {
        this.repository = repository;
    }

    @Override
    public Map<String, Integer> analyzeText(String email, String text) {
        // 1. OpenAI 요청 프롬프트
        String prompt = String.format(
                "다음 문장을 감정별 비율(%%)로 분석해줘.\n" +
                "감정 카테고리: happiness, sadness, anger, anxiety, calmness, etc\n" +
                "문장: \"%s\"\n\n" +
                "반드시 총합이 100이 되도록 하고,\n" +
                "JSON만 출력:\n" +
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

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        // 2. OpenAI API 호출
        ResponseEntity<Map> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                entity,
                Map.class
        );

        Map<String, Object> resBody = response.getBody();
        String content = Optional.ofNullable(
                ((Map) ((Map) ((List) resBody.get("choices")).get(0)).get("message")).get("content")
        ).map(Object::toString).orElseThrow(() -> new RuntimeException("모델 응답 파싱 실패"));

        // 3. JSON 파싱
        Map<String, Integer> emotions;
        try {
            emotions = mapper.readValue(content, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("감정 JSON 파싱 실패: " + content, e);
        }

        // 4. DB 저장
        EmotionEntity entityToSave = EmotionEntity.builder()
                .email(email)
                .inputText(text)
                .happiness(emotions.getOrDefault("happiness", 0))
                .sadness(emotions.getOrDefault("sadness", 0))
                .anger(emotions.getOrDefault("anger", 0))
                .anxiety(emotions.getOrDefault("anxiety", 0))
                .calmness(emotions.getOrDefault("calmness", 0))
                .etc(emotions.getOrDefault("etc", 0))
                .build();

        repository.save(entityToSave);

        // 5. JSON 그대로 반환
        return emotions;
    }
}
