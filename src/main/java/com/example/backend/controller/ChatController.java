package com.example.backend.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import com.example.backend.dto.chat.MessageRequest;
import com.example.backend.dto.chat.MessageResponse;
import com.example.backend.dto.chat.SessionHistory;
import com.example.backend.dto.chat.SessionRequest;
import com.example.backend.dto.common.ApiResponse;
import com.example.backend.service.ChatService;
import com.example.backend.service.ChatSessionService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
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
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(@Valid @RequestBody MessageRequest request, Authentication authentication) {
        try {
            System.out.println("Request: " + request);

            MessageResponse response = chatService.processMessage(
                    request.getSystemPrompt(),
                    authentication.getName(),
                    request.getUserMessage()
            );
            Long sessionId = response.getSessionId();

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
            log.info("채팅 세션 저장 완료 - 사용자: {}", request.getUserEmail());
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
    public ResponseEntity<ApiResponse<List<SessionHistory>>> getUserSessions(@RequestParam String userEmail) {
        try {
            List<SessionHistory> sessions = chatSessionService.getSessionsByUserEmail(userEmail);
            log.info("채팅 세션 조회 완료 - 사용자: {}, 개수: {}", userEmail, sessions.size());
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
    
    /**
     * 신규 채팅 모델 테스트용
     */
    private final RestTemplate restTemplate;

    @GetMapping("/test/new")
    public ResponseEntity<Object> getNewModelResult(HttpServletRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("text", "상담사: 안녕하세요, 오늘은 어떤 어려움이 있으신가요?\n내담자: 최근에 회사에서 성과를 내지 못해 불안해요.\n상담사: 구체적으로 어떤 상황이었나요?\n내담자: 보고서를 제때 제출하지 못해서 상사에게 크게 혼났습니다.\n상담사: 그 이후로 어떤 변화가 있었나요?\n내담자: 계속 눈치 보게 되고, 동료들과도 말하기가 힘들어졌어요.\n상담사: 대인관계가 위축되신 거군요. 수면은 어떠신가요?\n내담자: 잘 못 자요. 잠들기도 어렵고, 새벽에 자주 깨요.\n상담사: 수면 부족이 일상에 영향을 주고 있나요?\n내담자: 네, 집중이 안 되고 작은 실수도 자주 합니다.\n상담사: 혹시 위험한 생각까지 이어진 적이 있나요?\n내담자: 솔직히 그냥 다 포기하고 싶다는 생각이 든 적 있어요.\n상담사: 그런 생각이 드실 때 스스로 어떻게 대처하시나요?\n내담자: 운동을 하거나 음악을 듣습니다. 그러면 조금 나아집니다.\n상담사: 좋은 방법이네요. 최근에 기분이 나아졌던 순간도 있나요?\n내담자: 지난주에 친구와 산책했을 때 잠깐 편안했어요.\n상담사: 아주 좋은 경험이에요. 이런 활동을 조금씩 늘려가면 도움이 될 수 있습니다.\n내담자: 네, 앞으로도 친구들과 더 자주 만나려고 해요");
        payload.put("max_new_tokens", 512);
        String url = "http://121.78.130.209:8111/full_analyze";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
        try {
            ResponseEntity<String> resp = restTemplate.exchange(
                url, HttpMethod.POST, entity, String.class);

            // 외부 응답을 그대로 전달(JSON)
            MediaType contentType = MediaType.APPLICATION_JSON;
            HttpHeaders outHeaders = new HttpHeaders();
            outHeaders.setContentType(contentType);
            return new ResponseEntity<>(resp.getBody(), outHeaders, resp.getStatusCode());
        } catch (HttpStatusCodeException ex) {
            // 외부 API 4xx/5xx를 그대로 전파
            HttpHeaders outHeaders = new HttpHeaders();
            outHeaders.setContentType(MediaType.APPLICATION_JSON);
            String body = ex.getResponseBodyAsString();
            if (body == null || body.isBlank()) {
                body = "{\"error\":\"" + ex.getStatusText() + "\",\"status\":" + ex.getStatusCode().value() + "}";
            }
            return new ResponseEntity<>(body, outHeaders, ex.getStatusCode());
        }
    }
}
