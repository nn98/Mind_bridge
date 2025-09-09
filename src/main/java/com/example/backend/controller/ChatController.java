package com.example.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.common.ApiResponse;
import com.example.backend.service.ChatService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 채팅 관련 REST API 컨트롤러
 */
@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/analysis/save")
    public ResponseEntity<Map<String, Object>> receiveAnalysis(@RequestBody Map<String, Object> payload) {
        System.out.println("📩 [Spring] FastAPI에서 전달받은 분석 결과 ----------------");
        System.out.println("user_name: " + payload.get("name"));
        System.out.println("depression: " + payload.get("email"));
        System.out.println("summary: " + payload.get("summary"));
        System.out.println("riskFactors: " + payload.get("riskFactors"));
        System.out.println("protectiveFactors: " + payload.get("protectiveFactors"));
        System.out.println("clientEmotion: " + payload.get("clientEmotion"));
        System.out.println("-----------------------------------------------------");

        return ResponseEntity.ok(payload); // 확인용 응답
    }

    /**
     * 채팅 세션 완료
     */
    @PostMapping("/session/{sessionId}/complete")
    public ResponseEntity<ApiResponse<String>> completeSession(
            @PathVariable Long sessionId,
            @RequestParam(required = false) String summary,
            @RequestParam(required = false) String emotion,
            @RequestParam(required = false) String aiSummary,
            @RequestParam(required = false) Integer score) {
        try {
            chatService.completeSession(sessionId, summary, emotion, aiSummary, score);
            return ResponseEntity.ok(ApiResponse.success("세션이 완료되었습니다."));
        } catch (Exception e) {
            log.error("세션 완료 처리 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("세션 완료 처리에 실패했습니다.", e.getMessage()));
        }
    }
}
