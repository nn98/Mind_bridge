package com.example.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordWithReauthRequest(
	@NotBlank(message = "Current password is required")
	String currentPassword,

	@NotBlank(message = "New password is required")
	@Size(min = 10, max = 128, message = "Password must be 10-128 characters")
	String newPassword
) {}
