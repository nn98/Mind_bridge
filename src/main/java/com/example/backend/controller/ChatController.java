package com.example.backend.controller;

import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.common.error.ForbiddenException;
import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.chat.ChatMessageDto;
import com.example.backend.dto.chat.ChatMessageRequest;
import com.example.backend.dto.chat.ChatSessionDto;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.dto.common.ApiResponse;
import com.example.backend.entity.ChatMessageEntity;
import com.example.backend.entity.ChatSessionEntity;
import com.example.backend.security.SecurityUtil;
import com.example.backend.service.ChatService;
import com.example.backend.service.DailyMetricsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final DailyMetricsService dailyMetricsService;
    private final SecurityUtil securityUtil;
    private final ChatService chatService;

    // ================== FastAPI 연동 (공개 API) ==================

    @PostMapping("/session/save")
    public ResponseEntity<ChatSessionEntity> receiveAnalysis(@RequestBody SessionRequest sessionRequest) {
        // 공개 API - 인증 불필요 (FastAPI에서 호출)
        log.info("📩 [Spring] FastAPI에서 받은 분석 결과: {}\n\t SessionRequest 객체: {}", sessionRequest.getSessionId(), sessionRequest);
        ChatSessionEntity saved = chatService.saveSession(sessionRequest);
        log.info("\t\t만들어진 엔티티: {}", saved);
        log.info("💾 [Spring] DB 저장 완료: {}", saved.getSessionId());
        dailyMetricsService.increaseChatCount();
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/message/save")
    public ResponseEntity<ChatMessageEntity> saveMessage(@RequestBody ChatMessageRequest dto) {
        // 공개 API - 인증 불필요 (FastAPI에서 호출)
        log.info("dto: " + dto.toString());
        ChatMessageEntity saved = chatService.saveMessage(dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/analysis/search")
    public ResponseEntity<List<ChatSessionEntity>> getCounsellings(
        @RequestParam String email,
        @RequestParam String name) {
        // FastAPI에서 Spring으로 분석 결과 조회 (공개 API)
        List<ChatSessionEntity> result = chatService.getSessionsByEmailAndName(email, name);
        return ResponseEntity.ok(result);
    }

    // ================== 사용자 API (인증 필요) ==================

    @GetMapping("/sessions")
    @PreAuthorize("isAuthenticated()") // ✅ 인증된 사용자만
    public ResponseEntity<List<ChatSessionDto>> getChatSessions(Authentication authentication) {
        String email = securityUtil.requirePrincipalEmail(authentication);
        List<ChatSessionDto> sessions = chatService.getChatSessionsByUserEmail(email);

        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .header("Pragma", "no-cache")
            .header("Expires", "0")
            .body(sessions);
    }

    @GetMapping("/messages/{sessionId}")
    @PreAuthorize("@chatAuth.canAccessSession(#sessionId, authentication.name) or hasRole('ADMIN')") // ✅ ChatAuth 사용
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getMessages(
        @PathVariable String sessionId,
        Authentication authentication) {

        try {
            List<ChatMessageDto> result = chatService.getMessagesBySessionId(sessionId, authentication.getName());
            return ResponseEntity.ok(ApiResponse.success(result, "메시지를 성공적으로 조회했습니다."));
        } catch (NotFoundException e) {
            throw new NotFoundException("세션을 찾을 수 없습니다.", "SESSION_NOT_FOUND", "sessionId");
        } catch (ForbiddenException e) {
            throw new ForbiddenException("세션 접근 권한이 없습니다.", "ACCESS_DENIED");
        }
    }

    // ================== 추가 권한 검증 엔드포인트들 ==================

    @GetMapping("/sessions/{sessionId}")
    @PreAuthorize("@chatAuth.canAccessSession(#sessionId, authentication.name) or hasRole('ADMIN')") // ✅ ChatAuth 사용
    public ResponseEntity<ApiResponse<ChatSessionDto>> getChatSession(
        @PathVariable String sessionId,
        Authentication authentication) {

        return chatService.getSessionById(sessionId)
            .map(session -> ResponseEntity.ok(ApiResponse.success(session, "세션을 성공적으로 조회했습니다.")))
            .orElseThrow(() -> new NotFoundException("세션을 찾을 수 없습니다.", "SESSION_NOT_FOUND", "sessionId"));
    }

    @DeleteMapping("/sessions/{sessionId}")
    @PreAuthorize("@chatAuth.canDeleteSession(#sessionId, authentication.name) or hasRole('ADMIN')") // ✅ ChatAuth 사용
    public ResponseEntity<ApiResponse<String>> deleteSession(
        @PathVariable String sessionId,
        Authentication authentication) {

        chatService.deleteSession(sessionId);
        return ResponseEntity.ok(ApiResponse.success("세션이 삭제되었습니다."));
    }
}
