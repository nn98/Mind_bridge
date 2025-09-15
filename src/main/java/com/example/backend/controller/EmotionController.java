// controller/EmotionController.java
package com.example.backend.controller;

import com.example.backend.dto.common.ApiResponse;
import com.example.backend.dto.emotion.EmotionRequest;
import com.example.backend.dto.emotion.EmotionResponse;
import com.example.backend.service.EmotionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/emotion")
public class EmotionController {

    private final EmotionService emotionService;

    public EmotionController(EmotionService emotionService) {
        this.emotionService = emotionService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<EmotionResponse>> analyzeEmotion(@RequestBody EmotionRequest request) {
        Map<String, Integer> result = emotionService.analyzeText(request.getEmail(), request.getText());
        return ResponseEntity.ok(ApiResponse.success(new EmotionResponse(result)));
    }
}
