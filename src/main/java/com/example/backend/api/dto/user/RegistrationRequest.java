package com.example.backend.api.dto.user;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistrationRequest {

    // 나이: 필수, 1~150
    @NotNull(message = "나이는 필수입니다")
    @Min(value = 1, message = "나이는 1 이상이어야 합니다")
    @Max(value = 150, message = "나이는 150 이하여야 합니다")
    private Integer age;

    // 이메일: 필수, 형식
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;

    // 비밀번호: 필수, 8자 이상 + 대문자/소문자/숫자/특수문자 1개 이상
    // 특수문자 집합은 필요에 맞게 조정 가능
    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;\"'`~<>,.?/\\\\|]).{8,}$",
        message = "비밀번호는 대문자/소문자/숫자/특수문자를 각각 1자 이상 포함해야 합니다"
    )
    private String password;

    // 성명: 선택(필수 지정 시 @NotBlank 추가)
    private String fullName;

    // 닉네임: 필수, 2~20자
    @NotBlank(message = "닉네임은 필수입니다")
    @Size(min = 2, max = 20, message = "닉네임은 2-20자 사이여야 합니다")
    private String nickname;

    // 성별: 필수(값의 도메인이 정해져 있으면 패턴/Enum 변환 고려)
    @NotBlank(message = "성별은 필수입니다")
    private String gender;

    // 전화번호: 필수, 숫자만 10~11자리(국내 휴대폰 기준. 하이픈 허용하려면 패턴 변경)
    @NotBlank(message = "전화번호는 필수입니다")
    @Pattern(
        regexp = "^(?:\\d{10,11}|\\d{2,3}-\\d{3,4}-\\d{4})$",
        message = "전화번호는 숫자 10~11자리 또는 하이픈 포함 형식(예: 010-1234-5678)이어야 합니다"
    )
    private String phoneNumber;

    // 선택 필드
    private String mentalState;

    // 약관 동의: 필수로 true
    @NotNull(message = "약관 동의 여부는 필수입니다")
    @AssertTrue(message = "약관에 동의해야 합니다")
    private Boolean termsAccepted;
}
