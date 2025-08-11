package com.example.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.CounsellingDTO;
import com.example.backend.dto.CounsellingSaveRequestDTO;
import com.example.backend.entity.Counselling;
import com.example.backend.repository.CounsellingRepository;

@Service
public class CounsellingService {

    private final CounsellingRepository counsellingRepository;

    public CounsellingService(CounsellingRepository counsellingRepository) {
        this.counsellingRepository = counsellingRepository;
    }
    //작업 중 실패하면 다 롤백
    @Transactional
    public CounsellingDTO saveCounselling(CounsellingSaveRequestDTO requestDTO) {
        Counselling counselling = new Counselling();
        counselling.setEmail(requestDTO.getEmail());
        counselling.setUserCounsellingSummation(requestDTO.getUserCounsellingSummation());
        counselling.setUserCounsellingEmotion(requestDTO.getUserCounsellingEmotion());
        counselling.setCounselorSummation(requestDTO.getCounselorSummation());

        Counselling saved = counsellingRepository.save(counselling);

        CounsellingDTO dto = new CounsellingDTO();
        dto.setCounselId(saved.getCounselId());
        dto.setEmail(saved.getEmail());
        dto.setUserCounsellingSummation(saved.getUserCounsellingSummation());
        dto.setUserCounsellingEmotion(saved.getUserCounsellingEmotion());
        dto.setCounselorSummation(saved.getCounselorSummation());

        return dto;
    }
}
