package com.example.backend.controller;

import com.example.backend.dto.chat.MessageRequest;
import com.example.backend.dto.chat.MessageResponse;
import com.example.backend.dto.chat.SessionHistory;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.dto.common.ApiResponse;
import com.example.backend.service.ChatService;
import com.example.backend.service.ChatSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 채팅 관련 REST API 컨트롤러
 */
@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatSessionService chatSessionService;
    private final ChatService chatService;

    /**
     * 새로운 채팅 세션 시작
     */
    @PostMapping("/session/start")
    public ResponseEntity<ApiResponse<Long>> startNewSession(@RequestParam String email) {
        try {
            Long sessionId = chatService.createNewSession(email);
            return ResponseEntity.ok(ApiResponse.success(sessionId));
        } catch (Exception e) {
            log.error("새 세션 생성 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("새 세션 생성에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 메시지 전송 및 AI 응답 받기
     */
    @PostMapping("/message")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(@Valid @RequestBody MessageRequest request) {
        try {
            Long sessionId = Long.parseLong(request.getSessionId());

            MessageResponse response = chatService.processMessage(
                    request.getSystemPrompt(),
                    sessionId,
                    request.getUserMessage()
            );

            log.info("메시지 처리 완료 - 세션ID: {}", sessionId);
            return ResponseEntity.ok(ApiResponse.success(response));

        } catch (Exception e) {
            log.error("메시지 처리 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("메시지 처리에 실패했습니다.", e.getMessage()));
        }
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

    // 기존 세션 관련 엔드포인트들...

    /**
     * 채팅 세션 저장 (기존 방식 유지)
     */
    @PostMapping("/session/save")
    public ResponseEntity<ApiResponse<SessionHistory>> saveSession(@Valid @RequestBody SessionRequest request) {
        try {
            SessionHistory savedSession = chatSessionService.saveSession(request);
            log.info("채팅 세션 저장 완료 - 사용자: {}", request.getEmail());
            return ResponseEntity.ok(ApiResponse.success(savedSession));
        } catch (Exception e) {
            log.error("채팅 세션 저장 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("채팅 세션 저장에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 사용자별 채팅 세션 목록 조회
     */
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<SessionHistory>>> getUserSessions(@RequestParam String email) {
        try {
            List<SessionHistory> sessions = chatSessionService.getSessionsByEmail(email);
            log.info("채팅 세션 조회 완료 - 사용자: {}, 개수: {}", email, sessions.size());
            return ResponseEntity.ok(ApiResponse.success(sessions));
        } catch (Exception e) {
            log.error("채팅 세션 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("채팅 세션 조회에 실패했습니다.", e.getMessage()));
        }
    }

    /**
     * 완료된 세션 수 조회
     */
    @GetMapping("/sessions/count")
    public ResponseEntity<ApiResponse<Long>> getCompletedSessionCount(@RequestParam String email) {
        try {
            long count = chatSessionService.getCompletedSessionCount(email);
            return ResponseEntity.ok(ApiResponse.success(count));
        } catch (Exception e) {
            log.error("완료된 세션 수 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("세션 수 조회에 실패했습니다.", e.getMessage()));
        }
    }
}
