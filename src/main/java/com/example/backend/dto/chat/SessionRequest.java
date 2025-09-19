package com.example.backend.dto.chat;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * 채팅 세션 저장 요청 DTO
 * DB 컬럼 매핑:
 * - user_email          VARCHAR(255)
 * - user_name           VARCHAR(255)
 * - summary             TEXT        (서버단 길이 제한 필요)
 * - emotions            TEXT
 * - primary_risk        VARCHAR(255)
 * - risk_factors        TEXT
 * - protective_factors  TEXT
 */
@Getter
@Setter
public class SessionRequest {

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @Size(max = 255, message = "이메일은 255자 이하로 입력해주세요.")
    private String userEmail;

    @Size(max = 255, message = "사용자 이름은 255자 이하로 입력해주세요.")
    private String userName;

    // summary/emotions/risk_factors/protective_factors 는 DB TEXT이므로
    // 너무 큰 페이로드 방지 차원에서 합리적인 상한을 둠(예: 10,000자)
    @Size(max = 10_000, message = "요약은 10,000자 이내로 입력해주세요.")
    private String summary;       // 사용자 대화 요약

    @Size(max = 2_000, message = "감정 분석 문자열은 2,000자 이내로 입력해주세요.")
    private String emotions;      // 감정 지표 집합(합계 100% 기준)

    @Size(max = 255, message = "가장 심각한 위험요인은 255자 이하로 입력해주세요.")
    private String primaryRisk;   // 가장 심각한 위험요인(단일)

    @Size(max = 5_000, message = "위험요인 목록은 5,000자 이내로 입력해주세요.")
    private String riskFactors;   // 부정적 위험요인들(각각 0.0~1.0, 복수)

    @Size(max = 5_000, message = "보호요인 목록은 5,000자 이내로 입력해주세요.")
    private String protectiveFactors; // 보호요인들(복수)
}
