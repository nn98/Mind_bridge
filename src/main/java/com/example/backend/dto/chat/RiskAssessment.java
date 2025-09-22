package com.example.backend.dto.chat;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class RiskAssessment {
    private String riskFactors;
    private String primaryRisk;
    private LocalDateTime createdAt; // LocalDateTime으로 변경
    private String sessionId;
    private String userEmail;
}
