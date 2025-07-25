package com.example.backend.controller;

import com.example.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // 상담 시작용 초기 메시지 (예: AI가 처음 던지는 질문)
    @GetMapping("/session")
    public ResponseEntity<Map<String, Object>> getInitialMessage(@RequestParam String email) {
        Map<String, Object> response = new HashMap<>();
        try {
            var chat = chatService.getChatByEmail(email);
            if (chat == null) {
                response.put("initialMessage", "새로운 상담 세션입니다. 무엇을 도움을 필요하신가요?");
            } else {
                response.put("initialMessage", "이어서 상담을 진행할 수 있습니다. 무엇을 도움을 필요하신가요?");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace(); // 콘솔 출력
            response.put("error", "서버 오류가 발생했습니다. (초기 세션)");
            return ResponseEntity.status(500).body(response);
        }
    }

    // 사용자 메시지를 받아 AI 응답을 반환
    @PostMapping("/session/message")
    public ResponseEntity<Map<String, Object>> postUserMessage(
            @RequestParam String email,
            @RequestBody Map<String, String> requestBody
    ) {
        Map<String, Object> response = new HashMap<>();
        try {
            String userMessage = requestBody.get("message");

            if (userMessage == null || userMessage.trim().isEmpty()) {
                throw new IllegalArgumentException("메시지 내용이 비어 있습니다.");
            }

            // AI 응답 받기
            String aiJsonString = chatService.processUserMessage(email, userMessage);
            System.out.println("🔹 AI 응답 원본: " + aiJsonString);

            // JSON 파싱
            JSONObject aiJson = new JSONObject(aiJsonString);

            // 응답 구성
            response.put("감정", aiJson.optString("감정", "감정 분석 없음"));
            response.put("상담사_응답", aiJson.optString("상담사_응답", "상담사 응답 없음"));
            response.put("요약", aiJson.optString("요약", "요약 없음"));
            response.put("세션_종료", aiJson.optBoolean("세션_종료", false));

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            e.printStackTrace(); // 콘솔 출력
            response.put("error", "서버 오류가 발생했습니다. (IO 예외)");
            return ResponseEntity.status(500).body(response);
        } catch (IllegalArgumentException e) {
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            e.printStackTrace(); // 모든 예외 로깅
            response.put("error", "서버 오류가 발생했습니다. (예상치 못한 오류)");
            return ResponseEntity.status(500).body(response);
        }
    }
}
