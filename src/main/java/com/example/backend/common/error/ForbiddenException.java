package com.example.backend.common.error;

public class ForbiddenException extends RuntimeException {
	private final String code;
	public ForbiddenException(String message) { this(message, null); }
	public ForbiddenException(String message, String code) {
		super(message);
		this.code = code;
	}
	public String code() { return code; }
}
