package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    //저장
    @PostMapping("/analysis/save")
    public ResponseEntity<CounsellingEntity> receiveAnalysis(@RequestBody Map<String, Object> payload) {
        CounsellingEntity saved = counsellingService.saveAnalysis(payload);

        return ResponseEntity.ok(saved);
    }

    //db에서 이메일 + 이름으로 상담내역 조회
    @GetMapping("/analysis/search")
    public ResponseEntity<List<CounsellingEntity>> getCounsellings(
            @RequestParam String email,
            @RequestParam String name) {
        List<CounsellingEntity> result = counsellingService.getCounsellingsByEmailAndName(email, name);
        return ResponseEntity.ok(result);
    }

}
