package com.example.backend.dto.user;

public record AvailabilityResponse(
	boolean available,
	String type,
	String value
) {}
