package com.example.backend.domain.user.vo;

import com.example.backend.domain.common.ValueObject;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.util.regex.Pattern;

@Getter
@EqualsAndHashCode
public class Email implements ValueObject {

	private static final Pattern EMAIL_PATTERN =
		Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

	private final String value;

	private Email(String value) {
		this.value = value;
	}

	public static Email of(String email) {
		if (email == null || email.trim().isEmpty()) {
			throw new IllegalArgumentException("Email cannot be null or empty");
		}

		if (!EMAIL_PATTERN.matcher(email).matches()) {
			throw new IllegalArgumentException("Invalid email format: " + email);
		}

		return new Email(email.toLowerCase().trim());
	}

	@Override
	public String toString() {
		return value;
	}
}
