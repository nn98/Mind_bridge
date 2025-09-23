package com.example.backend.controller;

import java.io.IOException;
import java.net.URI;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.example.backend.common.error.validation.ValidationErrorProcessor;
import com.example.backend.security.PIIMaskingUtils;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;

/** 테스트 전용 Security 설정: 운영 필터/구성 제외, 공개 경로만 permitAll */
@TestConfiguration
class TestSecurityConfig {

	@Bean
	SecurityFilterChain testSecurity(HttpSecurity http, ObjectMapper om) throws Exception {
		http
			.csrf(csrf -> csrf.disable())
			.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(auth -> auth
				.requestMatchers("/api/users/register",
					"/api/users/availability",
					"/api/users/summary").permitAll()
				.anyRequest().authenticated()
			)
			.exceptionHandling(ex -> ex
				.authenticationEntryPoint((req, res, e) -> writeProblem(res, om, req.getRequestURI(), HttpStatus.UNAUTHORIZED))
				.accessDeniedHandler((req, res, e) -> writeProblem(res, om, req.getRequestURI(), HttpStatus.FORBIDDEN))
			);
		return http.build();
	}

	private static void writeProblem(HttpServletResponse res, ObjectMapper om, String uri, HttpStatus status) throws IOException {
		ProblemDetail pd = ProblemDetail.forStatus(status);
		pd.setTitle(status == HttpStatus.UNAUTHORIZED ? "Unauthorized" : "Forbidden");
		pd.setInstance(URI.create(uri));
		res.setStatus(status.value());
		res.setContentType("application/problem+json");
		om.writeValue(res.getOutputStream(), pd);
	}

	@Bean
	@Primary  // 테스트에서 우선 사용
	public PIIMaskingUtils testPIIMaskingUtils() {
		return new PIIMaskingUtils();
	}

	@Bean
	@Primary
	public ValidationErrorProcessor testValidationErrorProcessor() {
		return new ValidationErrorProcessor(testPIIMaskingUtils());
	}
}

/** 컨트롤러에서 NotFoundException 던질 때 404 RFC7807로 직렬화 */
@RestControllerAdvice
@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)
class TestErrorAdvice {

	@ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
	public org.springframework.http.ResponseEntity<org.springframework.http.ProblemDetail>
	handleValidation(org.springframework.web.bind.MethodArgumentNotValidException ex,
		jakarta.servlet.http.HttpServletRequest req) {

		var pd = ex.getBody(); // 스프링이 만든 ProblemDetail 가져오기
		pd.setStatus(422);
		pd.setTitle("Unprocessable Content"); // 선택
		pd.setInstance(java.net.URI.create(req.getRequestURI()));

		// 필드 에러 맵을 추가(선택)
		var fieldErrors = ex.getBindingResult().getFieldErrors().stream()
			.collect(java.util.stream.Collectors.groupingBy(
				org.springframework.validation.FieldError::getField,
				java.util.stream.Collectors.mapping(org.springframework.context.support.DefaultMessageSourceResolvable::getDefaultMessage,
					java.util.stream.Collectors.toList())));
		pd.setProperty("errors", fieldErrors);

		return org.springframework.http.ResponseEntity.unprocessableEntity().body(pd);
	}

	@ExceptionHandler(com.example.backend.common.error.NotFoundException.class)
	public org.springframework.http.ProblemDetail handleNotFound(com.example.backend.common.error.NotFoundException ex,
		jakarta.servlet.http.HttpServletRequest req) {
		var pd = org.springframework.http.ProblemDetail.forStatus(org.springframework.http.HttpStatus.NOT_FOUND);
		pd.setTitle("Not Found");
		pd.setDetail(ex.getMessage());
		pd.setInstance(java.net.URI.create(req.getRequestURI()));
		return pd;
	}
}
