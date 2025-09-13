// dto/auth/ResetPasswordRequest.java
package com.example.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequest {

    @NotBlank(message = "이메일은 필수입니다")
    private String email;

    @NotBlank(message = "전화번호는 필수입니다")
    private String phoneNumber;
}
