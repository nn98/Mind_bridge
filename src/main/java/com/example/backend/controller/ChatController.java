package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.backend.entity.CounsellingEntity;
import com.example.backend.entity.ChatHistoryEntity;
import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.service.CounsellingService;
import com.example.backend.service.DailyMetricsService;
import com.example.backend.service.ChatHistoryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private CounsellingService counsellingService;
    private final DailyMetricsService dailyMetricsService;
    private final ChatHistoryService chatHistoryService;

    // 저장
    @PostMapping("/analysis/save")
    public ResponseEntity<CounsellingEntity> receiveAnalysis(@RequestBody Map<String, Object> payload) {
        log.info("📩 [Spring] FastAPI에서 받은 분석 결과: {}", payload);
        CounsellingEntity saved = counsellingService.saveAnalysis(payload);
        log.info("💾 [Spring] DB 저장 완료: {}", saved.getCounselId());
        dailyMetricsService.increaseChatCount();
        return ResponseEntity.ok(saved);
    }

    // db에서 이메일 + 이름으로 상담내역 조회
    @GetMapping("/analysis/search")
    public ResponseEntity<List<CounsellingEntity>> getCounsellings(
            @RequestParam String email,
            @RequestParam String name) {
        List<CounsellingEntity> result = counsellingService.getCounsellingsByEmailAndName(email, name);
        return ResponseEntity.ok(result);
    }

    // ✅ 메시지 저장 (FastAPI → Spring)
    @PostMapping("/message/save")
    public ResponseEntity<ChatHistoryEntity> saveMessage(@RequestBody ChatMessageRequest dto) {
        ChatHistoryEntity saved = chatHistoryService.saveMessage(dto);
        return ResponseEntity.ok(saved);
    }

}
