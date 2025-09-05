package com.example.backend.validation.constraints;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@NotBlank(message = "닉네임은 필수입니다")
@Size(min = 2, max = 20, message = "닉네임은 2-20자 사이여야 합니다")
@Constraint(validatedBy = {})
@Documented
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidNickname {
	String message() default "유효하지 않은 닉네임입니다";
	Class<?>[] groups() default {};
	Class<? extends Payload>[] payload() default {};
}