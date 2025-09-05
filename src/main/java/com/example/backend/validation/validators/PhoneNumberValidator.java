package com.example.backend.validation.validators;

import com.example.backend.validation.constraints.ValidPhoneNumber;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {

	private static final String PHONE_PATTERN = "^(?:\\d{10,11}|\\d{2,3}-\\d{3,4}-\\d{4})$";

	@Override
	public void initialize(ValidPhoneNumber constraintAnnotation) {
		// 초기화 로직이 필요한 경우 여기에 구현
	}

	@Override
	public boolean isValid(String phoneNumber, ConstraintValidatorContext context) {
		if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
			return false;
		}

		// 공백 제거 후 패턴 매칭
		String cleanPhone = phoneNumber.trim();
		return cleanPhone.matches(PHONE_PATTERN);
	}
}
