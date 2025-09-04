package com.example.backend.domain.user.vo;

import com.example.backend.domain.common.ValueObject;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Getter
@EqualsAndHashCode
public class Password implements ValueObject {

	private static final PasswordEncoder encoder = new BCryptPasswordEncoder();

	private final String value; // 이미 인코딩된 값

	private Password(String encodedValue) {
		this.value = encodedValue;
	}

	public static Password encode(String rawPassword) {
		if (rawPassword == null || rawPassword.trim().isEmpty()) {
			throw new IllegalArgumentException("Password cannot be null or empty");
		}

		return new Password(encoder.encode(rawPassword));
	}

	public static Password of(String encodedPassword) {
		return new Password(encodedPassword);
	}

	public boolean matches(String rawPassword) {
		return encoder.matches(rawPassword, this.value);
	}
}
