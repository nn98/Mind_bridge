package com.example.backend.validation.constraints;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Documented
@Constraint(validatedBy = {})
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@NotBlank(message = "이메일은 필수입니다")
@Email(message = "올바른 이메일 형식이 아닙니다")
public @interface ValidEmail {
	String message() default "유효하지 않은 이메일 주소입니다";
	Class<?>[] groups() default {};
	Class<? extends Payload>[] payload() default {};
}
