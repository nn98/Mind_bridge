package com.example.backend.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.entity.CounsellingEntity;
import com.example.backend.service.CounsellingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private CounsellingService counsellingService;

    @PostMapping("/analysis/save")
    public ResponseEntity<CounsellingEntity> receiveAnalysis(@RequestBody Map<String, Object> payload) {
        CounsellingEntity saved = counsellingService.saveAnalysis(payload);

        return ResponseEntity.ok(saved);
    }

}
