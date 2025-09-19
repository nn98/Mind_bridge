package com.example.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskAssessment {

    private String riskFactors;   // 위험 요소
    private String division;      // 구분
    private String createdAt;     // 생성 시간
    private Long sessionId;       // 세션 ID
    private String userEmail;     // 사용자 이메일
}
