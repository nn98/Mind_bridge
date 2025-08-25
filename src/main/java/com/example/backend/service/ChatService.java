package com.example.backend.service;

import com.example.backend.dto.response.ChatMessageResponse;
import com.example.backend.entity.ChatHistoryEntity;
import com.example.backend.repository.ChatHistoryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final RestTemplate restTemplate;
    private final ChatHistoryRepository chatHistoryRepository;
    private final ObjectMapper objectMapper;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    public ChatMessageResponse processMessage(String systemPrompt) {
        try {
            // OpenAI API 요청
            String openAiResponse = callOpenAiApi(systemPrompt);

            // 응답 파싱
            ChatMessageResponse parsedResponse = parseOpenAiResponse(openAiResponse);

            // DB에 저장 (요청과 응답 모두 저장)
            saveChatHistory(systemPrompt, openAiResponse, parsedResponse);

            return parsedResponse;

        } catch (Exception e) {
            log.error("OpenAI API 호출 중 오류 발생: {}", e.getMessage(), e);
            return createErrorResponse("OpenAI 응답 오류");
        }
    }

    private String callOpenAiApi(String systemPrompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "gpt-4");
        requestBody.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", "상담을 시작해 주세요.")
        ));
        requestBody.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                entity,
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("OpenAI API 호출 실패: " + response.getStatusCode());
        }

        return response.getBody();
    }

    private ChatMessageResponse parseOpenAiResponse(String responseBody) {
        try {
            JsonNode rootNode = objectMapper.readTree(responseBody);
            String content = rootNode.path("choices").get(0).path("message").path("content").asText();

            // JSON 파싱 시도
            try {
                return objectMapper.readValue(content, ChatMessageResponse.class);
            } catch (Exception e) {
                // 파싱 실패시 기본값 반환
                log.warn("OpenAI 응답 JSON 파싱 실패: {}", e.getMessage());
                return createErrorResponse(content);
            }

        } catch (Exception e) {
            log.error("OpenAI 응답 처리 중 오류: {}", e.getMessage());
            return createErrorResponse("형식 오류");
        }
    }

    private ChatMessageResponse createErrorResponse(String content) {
        ChatMessageResponse errorResponse = new ChatMessageResponse();
        errorResponse.setEmotion("분석 실패");
        errorResponse.setCounselorResponse(content != null ? content : "형식 오류");
        errorResponse.setSummary("형식 오류");
        errorResponse.setSessionEnd(false);
        return errorResponse;
    }

    private void saveChatHistory(String systemPrompt, String openAiResponse, ChatMessageResponse parsedResponse) {
        try {
            ChatHistoryEntity chatHistory = new ChatHistoryEntity();
            chatHistory.setSystemPrompt(systemPrompt);
            chatHistory.setOpenaiRawResponse(openAiResponse);
            chatHistory.setParsedEmotion(parsedResponse.getEmotion());
            chatHistory.setParsedCounselorResponse(parsedResponse.getCounselorResponse());
            chatHistory.setParsedSummary(parsedResponse.getSummary());
            chatHistory.setSessionEnd(parsedResponse.isSessionEnd());
            chatHistory.setCreatedAt(LocalDateTime.now());

            chatHistoryRepository.save(chatHistory);
            log.info("채팅 기록 저장 완료");

        } catch (Exception e) {
            log.error("채팅 기록 저장 중 오류: {}", e.getMessage(), e);
            // 저장 실패해도 응답은 정상 반환 (비즈니스 로직에 영향 없음)
        }
    }
}
