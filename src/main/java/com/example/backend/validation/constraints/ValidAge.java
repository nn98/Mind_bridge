package com.example.backend.validation.constraints;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

@Min(value = 1, message = "나이는 1세 이상이어야 합니다")
@Max(value = 150, message = "나이는 150세 이하여야 합니다")
@Constraint(validatedBy = {})
@Documented
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidAge {
	String message() default "올바른 나이를 입력해주세요";
	Class<?>[] groups() default {};
	Class<? extends Payload>[] payload() default {};
}
