package com.example.backend.service.impl;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.backend.entity.CounsellingEntity;
import com.example.backend.repository.CounsellingRepository;
import com.example.backend.service.CounsellingService;

@Service
public class CounsellingServiceImpl implements CounsellingService {

    @Autowired
    private CounsellingRepository counsellingRepository;

    @Override
    public CounsellingEntity saveAnalysis(Map<String, Object> payload) {

        CounsellingEntity counselling = new CounsellingEntity();

        counselling.setUserEmail((String) payload.get("email"));
        counselling.setUserName((String) payload.get("name"));
        counselling.setSummary((String) payload.get("summary"));
        counselling.setRiskFactors(payload.get("riskFactors").toString());
        counselling.setProtectiveFactors(payload.get("protectiveFactors").toString());
        counselling.setSummaryEmotion((String) payload.get("clientEmotion"));

        // DB 저장
        return counsellingRepository.save(counselling);
    }

}
