package com.example.backend.common.error.validation;

import java.util.List;

import lombok.Builder;
import lombok.Getter;
import lombok.Singular;

/**
 * 검증 결과 요약
 */
@Getter
@Builder
public class ValidationResult {
	private final boolean valid;
	private final int errorCount;
	@Singular
	private final List<FieldError> fieldErrors;

	public boolean isInvalid() {
		return !valid;
	}

	public boolean hasFieldErrors() {
		return fieldErrors != null && !fieldErrors.isEmpty();
	}

	public List<String> getFailedFields() {
		return fieldErrors.stream()
			.map(FieldError::getField)
			.distinct()
			.toList();
	}
}
