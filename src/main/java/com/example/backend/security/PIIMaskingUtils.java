package com.example.backend.security;

import org.springframework.stereotype.Component;

/**
 * 개인정보 마스킹 유틸리티
 */
@Component
public class PIIMaskingUtils {

	public Object maskFieldValue(String fieldName, Object value) {
		if (value == null) return null;

		String field = fieldName.toLowerCase();
		String valueStr = value.toString();

		if (field.contains("email")) {
			return maskEmail(valueStr);
		}
		if (field.contains("phone")) {
			return maskPhone(valueStr);
		}
		if (field.contains("password")) {
			return "***마스킹됨***";
		}
		if (field.contains("token")) {
			return maskToken(valueStr);
		}

		return value;
	}

	public String maskEmail(String email) {
		if (email == null || !email.contains("@")) {
			return email;
		}

		String[] parts = email.split("@", 2);
		String username = parts[0];
		String domain = parts[1];

		if (username.length() <= 2) {
			return username.charAt(0) + "*@" + domain;
		}

		return username.charAt(0) + "***" + username.charAt(username.length() - 1) + "@" + domain;
	}

	public String maskPhone(String phone) {
		if (phone == null || phone.length() < 4) {
			return phone;
		}

		if (phone.contains("-")) {
			String[] parts = phone.split("-");
			if (parts.length == 3) {
				return parts[0] + "-****-" + parts[2];
			}
		}

		return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
	}

	public String maskToken(String token) {
		if (token == null || token.length() < 8) {
			return "***마스킹됨***";
		}

		return token.substring(0, 4) + "..." + token.substring(token.length() - 4);
	}
}
