package com.example.backend.validation.validators;

import com.example.backend.validation.constraints.ValidPassword;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

	private int minLength;
	private int maxLength;
	private boolean requireUppercase;
	private boolean requireLowercase;
	private boolean requireDigit;
	private boolean requireSpecialChar;

	@Override
	public void initialize(ValidPassword constraintAnnotation) {
		// ✅ 어노테이션 속성 사용
		this.minLength = constraintAnnotation.minLength();
		this.maxLength = constraintAnnotation.maxLength();
		this.requireUppercase = constraintAnnotation.requireUppercase();
		this.requireLowercase = constraintAnnotation.requireLowercase();
		this.requireDigit = constraintAnnotation.requireDigit();
		this.requireSpecialChar = constraintAnnotation.requireSpecialChar();
	}

	@Override
	public boolean isValid(String password, ConstraintValidatorContext context) {
		if (password == null || password.trim().isEmpty()) {
			return false;
		}

		boolean isValid = true;
		context.disableDefaultConstraintViolation(); // ✅ 기본 메시지 비활성화

		// 길이 체크
		if (password.length() < minLength || password.length() > maxLength) {
			context.buildConstraintViolationWithTemplate(
					String.format("비밀번호는 %d~%d자여야 합니다", minLength, maxLength))
				.addConstraintViolation();
			isValid = false;
		}

		// 대문자 체크
		if (requireUppercase && !password.matches(".*[A-Z].*")) {
			context.buildConstraintViolationWithTemplate("비밀번호에 대문자가 포함되어야 합니다")
				.addConstraintViolation();
			isValid = false;
		}

		// 소문자 체크
		if (requireLowercase && !password.matches(".*[a-z].*")) {
			context.buildConstraintViolationWithTemplate("비밀번호에 소문자가 포함되어야 합니다")
				.addConstraintViolation();
			isValid = false;
		}

		// 숫자 체크
		if (requireDigit && !password.matches(".*\\d.*")) {
			context.buildConstraintViolationWithTemplate("비밀번호에 숫자가 포함되어야 합니다")
				.addConstraintViolation();
			isValid = false;
		}

		// 특수문자 체크
		if (requireSpecialChar && !password.matches(".*[!@#$%^&*()_+\\-={}\\[\\]:;\"'`~<>,.?/\\\\|].*")) {
			context.buildConstraintViolationWithTemplate("비밀번호에 특수문자가 포함되어야 합니다")
				.addConstraintViolation();
			isValid = false;
		}

		return isValid;
	}
}
