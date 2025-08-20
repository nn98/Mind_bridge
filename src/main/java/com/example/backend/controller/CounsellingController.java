package com.example.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.CounsellingDTO;
import com.example.backend.request.CounsellingSaveRequest;
import com.example.backend.service.CounsellingService;

@RestController
@RequestMapping("/api/counselling")
public class CounsellingController {

    private final CounsellingService counsellingService;

    public CounsellingController(CounsellingService counsellingService) {
        this.counsellingService = counsellingService;
    }

    //저장
    @PostMapping("/save")
    public ResponseEntity<CounsellingDTO> saveCounselling(@RequestBody CounsellingSaveRequest requestDTO) {
        CounsellingDTO saved = counsellingService.saveCounselling(requestDTO);
        return ResponseEntity.ok(saved);
    }

    //조회
    @GetMapping("/list")
    public ResponseEntity<List<CounsellingDTO>> getCounsellingList(@RequestParam String email) {
        List<CounsellingDTO> counsellingList = counsellingService.getCounsellingListByEmail(email);
        return ResponseEntity.ok(counsellingList);
    }
}
