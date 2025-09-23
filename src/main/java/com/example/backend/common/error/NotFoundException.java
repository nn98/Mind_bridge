package com.example.backend.common.error;

public class NotFoundException extends RuntimeException {
	private final String code;
	private final String field;

	public NotFoundException(String message) {
		this(message, null, null);
	}
	public NotFoundException(String message, String code, String field) {
		super(message);
		this.code = code;
		this.field = field;
	}
	public String getCode() { return code; }
	public String getField() { return field; }
}
