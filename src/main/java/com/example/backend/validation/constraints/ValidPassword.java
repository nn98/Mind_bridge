package com.example.backend.validation.constraints;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.example.backend.validation.validators.PasswordValidator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

// @ValidPassword.java (고급 버전)
@Constraint(validatedBy = PasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {
	String message() default "비밀번호가 정책에 맞지 않습니다";
	Class<?>[] groups() default {};
	Class<? extends Payload>[] payload() default {};

	int minLength() default 8;
	int maxLength() default 128;
	boolean requireUppercase() default true;
	boolean requireLowercase() default true;
	boolean requireDigit() default true;
	boolean requireSpecialChar() default true;
}
