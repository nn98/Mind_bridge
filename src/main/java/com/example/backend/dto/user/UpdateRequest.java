package com.example.backend.dto.user;

import com.example.backend.validation.constraints.ValidAge;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRequest {

    private Long id;

    @NotBlank(message = "성명을 입력해주세요")
    @Size(max = 100, message = "성명은 100자 이하여야 합니다")
    private String fullName;

    @NotBlank(message = "닉네임을 입력해주세요")
    @Size(min = 2, max = 20, message = "닉네임은 2-20자 사이여야 합니다")
    private String nickname;

    @NotNull(message = "나이를 입력해주세요")
    @ValidAge
    private Integer age;

    @NotBlank(message = "성별을 선택해주세요")
    @Pattern(
        regexp = "^(?i)(male|female|other|unknown)$",  // ✅ ?제거 - 필수값
        message = "성별은 male, female, other, unknown 중 하나를 선택해주세요"
    )
    private String gender;

    @NotBlank(message = "현재 상태를 입력해주세요")
    @Size(max = 50, message = "현재 상태는 50자 이하여야 합니다")
    private String mentalState;

    @NotBlank(message = "연락처를 입력해주세요")
    @Pattern(
        regexp = "^(?:\\d{10,11}|\\d{2,3}-\\d{3,4}-\\d{4})$",  // ✅ ?제거 - 필수값
        message = "연락처는 올바른 전화번호 형식으로 입력해주세요"
    )
    private String phoneNumber;

    @NotBlank(message = "상담 목표를 입력해주세요")
    @Size(max = 10000, message = "상담 목표는 10000자 이하여야 합니다")
    private String chatGoal;

    @Size(max = 50, message = "채팅 스타일은 50자 이하여야 합니다")
    private String chatStyle;  // ✅ 이건 선택적으로 유지
}
