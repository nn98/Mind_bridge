package com.example.backend.validation.constraints;

import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.*;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Target({ TYPE })
@Retention(RUNTIME)
@Documented
@Constraint(validatedBy = com.example.backend.validation.validators.PasswordMatchesValidator.class)
public @interface PasswordMatches {
	String message() default "password and confirmPassword must match";
	Class<?>[] groups() default {};
	Class<? extends Payload>[] payload() default {};

	// 필드명 커스터마이즈 지원(기본은 password/confirmPassword)
	String password() default "password";
	String confirm() default "confirmPassword";
}
