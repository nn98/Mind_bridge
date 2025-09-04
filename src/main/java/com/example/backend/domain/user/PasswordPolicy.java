package com.example.backend.domain.user;

import java.util.List;
import java.util.regex.Pattern;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordPolicy {

	private static final Pattern STRONG_PASSWORD_PATTERN =
		Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{10,128}$");

	private static final int PASSWORD_HISTORY_LIMIT = 5;

	public void validate(String newPassword, List<String> passwordHistory) {
		validateStrength(newPassword);
		validateHistory(newPassword, passwordHistory);
	}

	private void validateStrength(String password) {
		if (!STRONG_PASSWORD_PATTERN.matcher(password).matches()) {
			throw new IllegalArgumentException(
				"Password must be 10-128 characters long and contain at least one lowercase, " +
					"one uppercase, one digit, and one special character"
			);
		}
	}

	private void validateHistory(String newPassword, List<String> passwordHistory) {
		if (passwordHistory == null) return;

		for (String oldHash : passwordHistory) {
			if (new BCryptPasswordEncoder().matches(newPassword, oldHash)) {
				throw new IllegalArgumentException("Password cannot be reused from recent history");
			}
		}
	}
}
