package com.example.backend.controller;

import java.io.IOException;
import java.net.URI;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** 테스트 전용 Security 설정: 운영 필터/구성 제외, 공개 경로만 permitAll */
@TestConfiguration
class TestSecurityConfig {

	@Bean ObjectMapper testObjectMapper() {
		return Jackson2ObjectMapperBuilder.json().build();
	}

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
}

/** 컨트롤러에서 NotFoundException 던질 때 404 RFC7807로 직렬화 */
@RestControllerAdvice
class TestErrorAdvice {
	@ExceptionHandler(com.example.backend.common.error.NotFoundException.class)
	public ProblemDetail handleNotFound(com.example.backend.common.error.NotFoundException ex,
		HttpServletRequest req) {
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		pd.setTitle("Not Found");
		pd.setDetail(ex.getMessage());
		pd.setInstance(URI.create(req.getRequestURI()));
		return pd;
	}
}
