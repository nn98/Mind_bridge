package com.example.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.CounsellingDTO;
import com.example.backend.dto.CounsellingSaveRequestDTO;
import com.example.backend.service.CounsellingService;

@RestController
@RequestMapping("/api/counselling")
public class CounsellingController {

    private final CounsellingService counsellingService;

    public CounsellingController(CounsellingService counsellingService) {
        this.counsellingService = counsellingService;
    }

    @PostMapping("/save")
    public ResponseEntity<CounsellingDTO> saveCounselling(@RequestBody CounsellingSaveRequestDTO requestDTO) {
        CounsellingDTO saved = counsellingService.saveCounselling(requestDTO);
        return ResponseEntity.ok(saved);
    }
}
