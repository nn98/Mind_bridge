package com.example.backend.service;

import java.util.Map;

import com.example.backend.entity.CounsellingEntity;

public interface CounsellingService {
    
    CounsellingEntity saveAnalysis(Map<String, Object> payload);
}
