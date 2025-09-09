package com.example.backend.common.error;

/** 외부 연동 실패를 나타내는 도메인 예외 (5단계에서 본격 적용 예정) */
public class ExternalServiceException extends RuntimeException {
	public ExternalServiceException(String message) { super(message); }
	public ExternalServiceException(String message, Throwable cause) { super(message, cause); }
}
