package com.example.backend.dto.user;

import com.example.backend.validation.constraints.ValidPassword;
import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(
	@NotBlank(message = "현재 비밀번호는 필수입니다")
	String currentPassword,

	@ValidPassword
	String password,

	@NotBlank(message = "비밀번호 확인은 필수입니다")
	String confirmPassword  // ✅ 추가!
) {}
