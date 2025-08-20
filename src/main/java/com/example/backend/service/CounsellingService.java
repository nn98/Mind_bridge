package com.example.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.CounsellingDTO;
import com.example.backend.entity.Counselling;
import com.example.backend.repository.CounsellingRepository;
import com.example.backend.request.CounsellingSaveRequest;

@Service
public class CounsellingService {

    private final CounsellingRepository counsellingRepository;

    public CounsellingService(CounsellingRepository counsellingRepository) {
        this.counsellingRepository = counsellingRepository;
    }

    /**
     * 상담 내용 저장
     *
     * @param request 클라이언트에서 전달받은 상담 데이터
     * @return 저장된 상담 정보 DTO
     */
    @Transactional
    public CounsellingDTO saveCounselling(CounsellingSaveRequest request) {
        Counselling counselling = new Counselling();
        counselling.setEmail(request.getEmail());
        counselling.setUserCounsellingSummation(request.getUserCounsellingSummation());
        counselling.setUserCounsellingEmotion(request.getUserCounsellingEmotion());
        counselling.setCounselorSummation(request.getCounselorSummation());

        Counselling saved = counsellingRepository.save(counselling);

        return mapToDTO(saved);
    }

    /**
     * 이메일 기준 상담 기록 조회
     *
     * @param email 조회할 사용자 이메일
     * @return 상담 기록 리스트
     */
    @Transactional(readOnly = true)
    public List<CounsellingDTO> getCounsellingListByEmail(String email) {
        List<Counselling> counsellingList = counsellingRepository.findByEmail(email);
        return counsellingList.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Entity → DTO 변환
     */
    private CounsellingDTO mapToDTO(Counselling counselling) {
        CounsellingDTO dto = new CounsellingDTO();
        dto.setCounselId(counselling.getCounselId());
        dto.setEmail(counselling.getEmail());
        dto.setUserCounsellingSummation(counselling.getUserCounsellingSummation());
        dto.setUserCounsellingEmotion(counselling.getUserCounsellingEmotion());
        dto.setCounselorSummation(counselling.getCounselorSummation());
        return dto;
    }
}
