package com.example.backend.common.error;

import java.net.URI;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import jakarta.servlet.http.HttpServletRequest;

public class ProblemDetailFactory {

	// ✅ URI를 직접 받도록 수정
	public static ProblemDetail create(HttpStatus status, URI type, String title,
		String detail, HttpServletRequest request) {
		ProblemDetail pd = ProblemDetail.forStatus(status);
		pd.setType(type);
		pd.setTitle(title);
		pd.setDetail(detail);
		pd.setInstance(URI.create(request.getRequestURI()));
		pd.setProperty("timestamp", Instant.now());
		return pd;
	}

	// ✅ 기존 메서드들
	public static ProblemDetail createValidation(String detail, HttpServletRequest request) {
		return create(HttpStatus.UNPROCESSABLE_ENTITY, Errors.TYPE_VALIDATION,
			"Validation Failed", detail, request);
	}

	// ✅ BadRequest 메서드 추가
	public static ProblemDetail createBadRequest(String detail, HttpServletRequest request) {
		return create(HttpStatus.BAD_REQUEST, Errors.TYPE_BAD_REQUEST,
			"Bad Request", detail, request);
	}

	public static ProblemDetail createNotFound(String detail, HttpServletRequest request) {
		return create(HttpStatus.NOT_FOUND, Errors.TYPE_NOT_FOUND,
			"Not Found", detail, request);
	}

	public static ProblemDetail createConflict(String detail, HttpServletRequest request) {
		return create(HttpStatus.CONFLICT, Errors.TYPE_CONFLICT,
			"Conflict", detail, request);
	}

	public static ProblemDetail createForbidden(String detail, HttpServletRequest request) {
		return create(HttpStatus.FORBIDDEN, Errors.TYPE_FORBIDDEN,
			"Forbidden", detail, request);
	}

	public static ProblemDetail createUnauthorized(String detail, HttpServletRequest request) {
		return create(HttpStatus.UNAUTHORIZED, Errors.TYPE_UNAUTHORIZED,
			"Unauthorized", detail, request);
	}

	public static ProblemDetail createInternalError(HttpServletRequest request) {
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
		pd.setTitle("Internal Server Error");
		pd.setDetail("Unexpected error occurred");
		pd.setInstance(URI.create(request.getRequestURI()));
		pd.setProperty("timestamp", Instant.now());
		return pd;
	}
}
