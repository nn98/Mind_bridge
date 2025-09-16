package com.example.backend.service.impl;

import java.util.List;
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

        // 리스트나 null일 수 있으므로 방어 처리
        Object risks = payload.get("riskFactors");
        counselling.setRiskFactors(risks != null ? risks.toString() : "");

        Object protects = payload.get("protectiveFactors");
        counselling.setProtectiveFactors(protects != null ? protects.toString() : "");

        counselling.setSummaryEmotion((String) payload.getOrDefault("clientEmotion", ""));

        // DB 저장
        return counsellingRepository.save(counselling);
    }


    //이메일 + 이름으로 상담내역 조회
    @Override
    public List<CounsellingEntity> getCounsellingsByEmailAndName(String userEmail, String userName) {
        return counsellingRepository.findAllByUserEmailAndUserNameOrderByCounselIdDesc(userEmail, userName);
    }

}
