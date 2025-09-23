package com.example.backend.common.error;

public class UnauthorizedException extends RuntimeException {
	private final String code;

	public UnauthorizedException(String message) {
		this(message, null);
	}
	public UnauthorizedException(String message, String code) {
		super(message);
		this.code = code;
	}
	public String getCode() { return code; }
}
