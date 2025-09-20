package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.dto.chat.RiskAssessment;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;
import com.example.backend.security.SecurityUtil;
import com.example.backend.service.ChatService;
import com.example.backend.service.DailyMetricsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final DailyMetricsService dailyMetricsService;
    private final SecurityUtil securityUtil;
    private final ChatService chatService;

    // 저장
    @PostMapping("/session/save")
    public ResponseEntity<ChatSessionEntity> receiveAnalysis(@RequestBody Map<String, Object> payload) {
        log.info("📩 [Spring] FastAPI에서 받은 분석 결과: {}", payload);
        ChatSessionEntity saved = chatService.saveAnalysis(payload);
        log.info("💾 [Spring] DB 저장 완료: {}", saved.getSessionId());
        dailyMetricsService.increaseChatCount();
        return ResponseEntity.ok(saved);
    }

    // db에서 이메일 + 이름으로 상담내역 조회
    @GetMapping("/analysis/search")
    public ResponseEntity<List<ChatSessionEntity>> getCounsellings(
            @RequestParam String email,
            @RequestParam String name) {
        List<ChatSessionEntity> result = chatService.getSessionsByEmailAndName(email, name);
        return ResponseEntity.ok(result);
    }

    // ✅ 메시지 저장 (FastAPI → Spring)
    @PostMapping("/message/save")
    public ResponseEntity<ChatMessageEntity> saveMessage(@RequestBody ChatMessageRequest dto) {
        log.info("dto: " + dto.toString());
        ChatMessageEntity saved = chatService.saveMessage(dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<RiskAssessment>> getRecentSessions(Authentication authentication) {
        String email = securityUtil.requirePrincipalEmail(authentication);
        List<RiskAssessment> assessments = chatService.getRiskAssessmentByUserEmail(email);
        log.info("email: {} / data: {}", email, assessments);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header("Pragma", "no-cache").header("Expires", "0")
            .body(assessments);
    }
}
