package com.example.backend.dto.user;

import com.example.backend.validation.constraints.PasswordMatches;
import com.example.backend.validation.constraints.ValidPassword;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 비밀번호 변경 요청 DTO (클래스 레벨 검증 포함)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@PasswordMatches // ← 클래스 레벨 검증!
public class ChangePasswordRequest {

	@NotBlank(message = "현재 비밀번호는 필수입니다")
	private String currentPassword;

	@NotBlank(message = "새 비밀번호는 필수입니다")
	@ValidPassword
	@Size(max = 255, message = "비밀번호가 너무 깁니다")
	private String password;  // newPassword 보다는 password가 일관성 있음

	@NotBlank(message = "비밀번호 확인은 필수입니다")
	private String confirmPassword;
}
