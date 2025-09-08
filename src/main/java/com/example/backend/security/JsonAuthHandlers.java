package com.example.backend.security;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletResponse;

/**
 * Spring Security 필터 단계에서 발생하는 인증/인가 예외를
 * RFC 7807 ProblemDetail(JSON)로 일관되게 직렬화하는 핸들러.
 * - Security 단계에서 처리되면 @RestControllerAdvice까지 전파되지 않으므로
 *   이 레벨에서 JSON 응답을 확정한다.
 */
public class JsonAuthHandlers {

	/** 401 Unauthorized 응답(JSON ProblemDetail) */
	public static AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper om) {
		return (request, response, authException) -> {
			ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
			pd.setTitle("Unauthorized");
			pd.setDetail(authException != null && authException.getMessage() != null
				? authException.getMessage() : "Authentication required");
			pd.setInstance(java.net.URI.create(request.getRequestURI()));
			writeJson(response, om, pd, HttpStatus.UNAUTHORIZED.value());
		};
	}

	/** 403 Forbidden 응답(JSON ProblemDetail) */
	public static AccessDeniedHandler accessDeniedHandler(ObjectMapper om) {
		return (request, response, accessDeniedException) -> {
			ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
			pd.setTitle("Forbidden");
			pd.setDetail(accessDeniedException != null && accessDeniedException.getMessage() != null
				? accessDeniedException.getMessage() : "Access denied");
			pd.setInstance(java.net.URI.create(request.getRequestURI()));
			writeJson(response, om, pd, HttpStatus.FORBIDDEN.value());
		};
	}

	/** 공통 JSON 쓰기 유틸 */
	private static void writeJson(HttpServletResponse res, ObjectMapper om, ProblemDetail pd, int status) throws IOException {
		res.setStatus(status);
		res.setContentType("application/problem+json"); // RFC 7807 권장 타입
		res.setCharacterEncoding("UTF-8");
		om.writeValue(res.getWriter(), pd);
	}
}
