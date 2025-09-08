package com.example.backend.dto.user;

import com.example.backend.validation.constraints.ValidNickname;
import com.example.backend.validation.constraints.ValidPassword;
import com.example.backend.validation.constraints.ValidPhoneNumber;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

// RegistrationRequest.java (개선된 버전)
@Getter
@Setter
@RequiredArgsConstructor
public class RegistrationRequest {
    @NotNull @Min(1) @Max(150)
    private Integer age;

    @NotBlank @Email
    private String email;

    @ValidPassword  // ✅ 커스텀 어노테이션 사용
    private String password;

    private String fullName;

    @ValidNickname  // ✅ 커스텀 어노테이션 사용
    private String nickname;

    @NotBlank
    private String gender;

    @ValidPhoneNumber  // ✅ 커스텀 어노테이션 사용
    private String phoneNumber;

    private String mentalState;

    @NotNull @AssertTrue
    private Boolean termsAccepted;
}
