package com.example.backend.common.error.validation;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.validation.BindingResult;

import com.example.backend.security.PIIMaskingUtils;

import jakarta.validation.ConstraintViolation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 검증 에러 처리 및 로깅 전담 클래스
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ValidationErrorProcessor {

	private final PIIMaskingUtils maskingUtils;

	/**
	 * MethodArgumentNotValidException 처리
	 */
	public ValidationResult processBindingResult(BindingResult bindingResult, String requestInfo) {
		List<FieldError> fieldErrors = bindingResult.getFieldErrors().stream()
			.map(error -> {
				Object maskedValue = maskingUtils.maskFieldValue(error.getField(), error.getRejectedValue());

				log.warn("검증 실패 - 필드: '{}', 메시지: '{}', 거부된값: '{}', 코드: '{}'",
					error.getField(),
					error.getDefaultMessage(),
					maskedValue,
					error.getCode());

				return FieldError.of(error, maskedValue);
			})
			.toList();

		String failedFields = fieldErrors.stream()
			.map(FieldError::getField)
			.distinct()
			.collect(Collectors.joining(", "));

		log.warn("검증 요약 - 요청: {}, 실패 필드: [{}], 총 에러수: {}개",
			requestInfo, failedFields, fieldErrors.size());

		return ValidationResult.builder()
			.valid(false)
			.errorCount(fieldErrors.size())
			.fieldErrors(fieldErrors)
			.build();
	}

	/**
	 * ConstraintViolationException 처리
	 */
	public ValidationResult processConstraintViolations(Set<ConstraintViolation<?>> violations, String requestInfo) {
		List<FieldError> fieldErrors = violations.stream()
			.map(violation -> {
				String field = violation.getPropertyPath().toString();
				Object maskedValue = maskingUtils.maskFieldValue(field, violation.getInvalidValue());

				log.warn("제약 조건 위반 - 필드: '{}', 메시지: '{}', 잘못된값: '{}', 어노테이션: '{}'",
					field,
					violation.getMessage(),
					maskedValue,
					violation.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName());

				return FieldError.of(violation, maskedValue);
			})
			.toList();

		String violatedFields = fieldErrors.stream()
			.map(FieldError::getField)
			.distinct()
			.collect(Collectors.joining(", "));

		log.warn("제약 조건 위반 요약 - 요청: {}, 위반 필드: [{}], 총 위반수: {}개",
			requestInfo, violatedFields, fieldErrors.size());

		return ValidationResult.builder()
			.valid(false)
			.errorCount(fieldErrors.size())
			.fieldErrors(fieldErrors)
			.build();
	}

	/**
	 * ProblemDetail용 errors 맵 생성
	 */
	public Map<String, List<String>> createErrorsMap(ValidationResult validationResult) {
		return validationResult.getFieldErrors().stream()
			.collect(Collectors.groupingBy(
				FieldError::getField,
				Collectors.mapping(FieldError::getMessage, Collectors.toList())
			));
	}
}
