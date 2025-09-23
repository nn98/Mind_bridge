package com.example.backend.common.error.validation;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

/**
 * 개별 필드 검증 실패 정보
 */
@Getter
@Builder
@ToString
public class FieldError {
	private final String field;
	private final String message;
	private final String rejectedValue;
	private final String code;
	private final Object[] arguments;

	public static FieldError of(org.springframework.validation.FieldError error, Object maskedValue) {
		return FieldError.builder()
			.field(error.getField())
			.message(error.getDefaultMessage())
			.rejectedValue(maskedValue != null ? maskedValue.toString() : null)
			.code(error.getCode())
			.arguments(error.getArguments())
			.build();
	}

	public static FieldError of(jakarta.validation.ConstraintViolation<?> violation, Object maskedValue) {
		return FieldError.builder()
			.field(violation.getPropertyPath().toString())
			.message(violation.getMessage())
			.rejectedValue(maskedValue != null ? maskedValue.toString() : null)
			.code(violation.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName())
			.build();
	}
}
