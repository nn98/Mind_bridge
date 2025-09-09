package com.example.backend.service;

import java.util.List;
import java.util.Map;

import com.example.backend.entity.CounsellingEntity;

public interface CounsellingService {

    //저장 
    CounsellingEntity saveAnalysis(Map<String, Object> payload);

    //이메일+이름으로 상담내역 조회
    List<CounsellingEntity> getCounsellingsByEmailAndName(String userEmail, String userName);

}
