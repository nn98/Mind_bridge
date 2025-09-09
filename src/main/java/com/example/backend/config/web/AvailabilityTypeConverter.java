package com.example.backend.config.web;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

import com.example.backend.dto.user.AvailabilityType;

@Component
public class AvailabilityTypeConverter implements Converter<String, AvailabilityType> {
	@Override
	public AvailabilityType convert(String source) {
		if (source == null) return null;
		String s = source.trim().toUpperCase();
		return switch (s) {
			case "NICKNAME", "NAME", "NICK" -> AvailabilityType.NICKNAME;
			case "EMAIL", "MAIL" -> AvailabilityType.EMAIL;
			default -> throw new IllegalArgumentException("type must be nickname or email");
		};
	}
}
