package com.example.backend.dto.user;

public enum AvailabilityType {
	NICKNAME, EMAIL;

	public static AvailabilityType from(String s) {
		if (s == null) throw new IllegalArgumentException("type is required");
		return switch (s.trim().toUpperCase()) {
			case "NICKNAME", "NAME", "NICK" -> NICKNAME;
			case "EMAIL", "MAIL" -> EMAIL;
			default -> throw new IllegalArgumentException("type must be nickname or email");
		};
	}
}
