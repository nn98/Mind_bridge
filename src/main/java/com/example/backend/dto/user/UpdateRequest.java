package com.example.backend.dto.user;

import com.example.backend.validation.constraints.ValidAge;
import com.example.backend.validation.constraints.ValidNickname;
import com.example.backend.validation.constraints.ValidPhoneNumber;
import com.example.backend.validation.groups.OnUpdate;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 사용자 정보 수정 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)  // ✅ email 같은 알 수 없는 필드 무시
public class UpdateRequest {

    @NotNull(groups = OnUpdate.class, message = "id는 업데이트 시 필수입니다")
    private Long id;

    @Size(max = 100, message = "성명은 100자 이하여야 합니다")
    private String fullName;

    @ValidNickname(groups = OnUpdate.class)
    @Size(max = 100, message = "닉네임은 100자 이하여야 합니다")
    private String nickname;

    @ValidAge
    private Integer age;

    @Pattern(
        regexp = "^(?i)(male|female|other|unknown)?$",
        message = "성별은 male, female, other, unknown 중 하나여야 합니다"
    )
    @Size(max = 20, message = "성별은 20자 이하여야 합니다")
    private String gender;

    @Size(max = 50, message = "정신상태는 50자 이하여야 합니다")
    private String mentalState;

    @ValidPhoneNumber
    @Pattern(
        regexp = "^(01[0-9]-?\\d{3,4}-?\\d{4}|0\\d{1,2}-?\\d{3,4}-?\\d{4})$",
        message = "전화번호는 E.164 형식(+821012345678) 또는 국내 형식(010-1234-5678)이어야 합니다"
    )
    @Size(max = 20, message = "전화번호는 20자 이하여야 합니다")
    private String phoneNumber;

    @Size(max = 10000, message = "채팅 목표는 10000자 이하여야 합니다")
    private String chatGoal;

    @Size(max = 50, message = "채팅 스타일은 50자 이하여야 합니다")
    private String chatStyle;
}
