package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.backend.entity.EmotionEntity;
import com.example.backend.repository.EmotionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class EmotionService {

    private final EmotionRepository repository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    public EmotionService(EmotionRepository repository) {
        this.repository = repository;
    }

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

        // GPT 응답에서 content 추출
        String content = Optional.ofNullable(
            ((Map<?, ?>) ((Map<?, ?>) ((List<?>) resBody.get("choices")).get(0)).get("message")).get("content")
        ).map(Object::toString).orElseThrow(() -> new RuntimeException("모델 응답 파싱 실패"));

        System.out.println("🔍 OpenAI 응답 content = " + content);

        // 3. JSON 파싱 (앞뒤 텍스트 제거 후 JSON만 추출)
        Map<String, Integer> emotions;
        try {
            int start = content.indexOf("{");
            int end = content.lastIndexOf("}");
            if (start != -1 && end != -1 && end > start) {
                String jsonOnly = content.substring(start, end + 1);
                emotions = mapper.readValue(jsonOnly, new TypeReference<Map<String, Integer>>() {});
            } else {
                throw new RuntimeException("유효한 JSON 형식이 아님: " + content);
            }
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
            .createdAt(LocalDateTime.now())
            .build();

        repository.save(entityToSave);

        // 5. JSON 그대로 반환
        return emotions;
    }
}
