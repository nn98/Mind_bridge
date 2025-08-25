package com.example.backend.service;

import com.example.backend.dto.chat.History;
import com.example.backend.dto.request.CounsellingRequest;
import com.example.backend.entity.ChatEntity;
import com.example.backend.repository.CounsellingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CounsellingService {

    private final CounsellingRepository counsellingRepository;

    public CounsellingService(CounsellingRepository counsellingRepository) {
        this.counsellingRepository = counsellingRepository;
    }

    /**
     * 상담 내용 저장
     */
    @Transactional
    public History saveCounselling(CounsellingRequest request) {
        // 요청 DTO → 엔티티 변환
        ChatEntity counselling = new ChatEntity();
        counselling.setEmail(request.getEmail());
        counselling.setUserCounsellingSummation(request.getUserCounsellingSummation());
        counselling.setUserCounsellingEmotion(request.getUserCounsellingEmotion());
        counselling.setCounselorSummation(request.getCounselorSummation());

        // 엔티티 저장
        ChatEntity saved = counsellingRepository.save(counselling);

        // 엔티티 → DTO 변환 후 반환
        return mapToDTO(saved);
    }

    /**
     * 이메일 기준 상담 기록 조회
     */
    @Transactional(readOnly = true)
    public List<History> getCounsellingListByEmail(String email) {
        List<ChatEntity> counsellingList = counsellingRepository.findByEmail(email);
        return counsellingList.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Entity → DTO 변환
     */
    private History mapToDTO(ChatEntity counselling) {
        History dto = new History();
        dto.setCounselId(counselling.getCounselId());
        dto.setEmail(counselling.getEmail());
        dto.setUserCounsellingSummation(counselling.getUserCounsellingSummation());
        dto.setUserCounsellingEmotion(counselling.getUserCounsellingEmotion());
        dto.setCounselorSummation(counselling.getCounselorSummation());
        return dto;
        
    }
}
