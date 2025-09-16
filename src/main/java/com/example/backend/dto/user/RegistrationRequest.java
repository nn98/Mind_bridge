package com.example.backend.dto.user;

import com.example.backend.validation.constraints.PasswordMatches;
import com.example.backend.validation.constraints.ValidNickname;
import com.example.backend.validation.constraints.ValidPassword;
import com.example.backend.validation.constraints.ValidPhoneNumber;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// RegistrationRequest.java (개선된 버전)
@Getter
@Setter
@PasswordMatches
@NoArgsConstructor
public class RegistrationRequest {
    @NotNull @Min(1) @Max(150) private Integer age;
    @Email @Size(max=255) private String email;
    @ValidPassword private String password;
    @ValidPassword private String confirmPassword;
    @Size(max=100) private String fullName;
    @Size(max=100) @ValidNickname private String nickname;
    @NotBlank @Size(max=20) private String gender;
    @ValidPhoneNumber @Size(max=20) private String phoneNumber;
    @Size(max=50) private String mentalState;
    @NotNull @AssertTrue private Boolean termsAccepted;
    @Size(max=32) private String termsVersion;
    private String chatStyle; //채팅스타일 
}
