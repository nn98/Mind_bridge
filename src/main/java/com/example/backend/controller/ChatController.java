package com.example.backend.controller;

import com.example.backend.dto.request.ChatMessageRequest;
import com.example.backend.dto.response.ChatMessageResponse;
import com.example.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/message")
    public ResponseEntity<ChatMessageResponse> sendMessage(@RequestBody ChatMessageRequest request) {
        ChatMessageResponse response = chatService.processMessage(request.getSystemPrompt());
        return ResponseEntity.ok(response);
    }
}
