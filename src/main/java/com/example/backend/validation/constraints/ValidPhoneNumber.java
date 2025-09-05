package com.example.backend.validation.constraints;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Pattern(
	regexp = "^(?:\\d{10,11}|\\d{2,3}-\\d{3,4}-\\d{4})$",
	message = "전화번호는 숫자 10~11자리 또는 하이픈 포함 형식이어야 합니다"
)
@NotBlank(message = "전화번호는 필수입니다")
@Constraint(validatedBy = {})
@Documented
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPhoneNumber {
	String message() default "유효하지 않은 전화번호입니다";
	Class<?>[] groups() default {};
	Class<? extends Payload>[] payload() default {};
}