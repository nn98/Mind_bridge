package com.example.backend.common.error;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

/**
 * 전역 예외 처리기
 * - 모든 REST 오류를 RFC 7807 ProblemDetail(JSON)로 일관되게 반환
 * - 검증/바인딩/도메인/보안/기타 예외의 상태 코드 및 응답 스키마 표준화
 */
@Slf4j
@RestControllerAdvice
public class ProblemDetailsAdvice {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
		log.warn("Validation 실패: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetailFactory.createValidation("One or more fields are invalid", req);
		Map<String, List<String>> errors = ex.getBindingResult().getFieldErrors().stream()
			.collect(Collectors.groupingBy(FieldError::getField,
				Collectors.mapping(DefaultMessageSourceResolvable::getDefaultMessage, Collectors.toList())));
		pd.setProperty("errors", errors);
		return ResponseEntity.unprocessableEntity().body(pd); // 422
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ProblemDetail> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest req) {
		log.warn("ConstraintViolation: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetailFactory.createValidation("One or more parameters are invalid", req);
		Map<String, List<String>> errors = ex.getConstraintViolations().stream()
			.collect(Collectors.groupingBy(
				v -> v.getPropertyPath().toString(),
				Collectors.mapping(ConstraintViolation::getMessage, Collectors.toList())
			));
		pd.setProperty("errors", errors);
		return ResponseEntity.badRequest().body(pd); // 400
	}

	@ExceptionHandler(BindException.class)
	public ResponseEntity<ProblemDetail> handleBind(BindException ex, HttpServletRequest req) {
		log.warn("Bind 실패: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetailFactory.createValidation("Binding failed", req);
		Map<String, List<String>> errors = ex.getBindingResult().getFieldErrors().stream()
			.collect(Collectors.groupingBy(FieldError::getField,
				Collectors.mapping(DefaultMessageSourceResolvable::getDefaultMessage, Collectors.toList())));
		pd.setProperty("errors", errors);
		return ResponseEntity.badRequest().body(pd); // 400
	}

	@ExceptionHandler(ConflictException.class)
	public ResponseEntity<ProblemDetail> handleConflict(ConflictException ex, HttpServletRequest req) {
		log.info("Conflict: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetailFactory.createConflict(ex.getMessage(), req);
		if (ex.code() != null) pd.setProperty("code", ex.code());
		if (ex.field() != null) pd.setProperty("field", ex.field());
		return ResponseEntity.status(HttpStatus.CONFLICT).body(pd); // 409
	}

	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<ProblemDetail> handleNotFound(NotFoundException ex, HttpServletRequest req) {
		log.info("NotFound: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetailFactory.createNotFound(ex.getMessage(), req);
		if (ex.code() != null) pd.setProperty("code", ex.code());
		if (ex.field() != null) pd.setProperty("field", ex.field());
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(pd); // 404
	}

	@ExceptionHandler(ForbiddenException.class)
	public ResponseEntity<ProblemDetail> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
		log.info("Forbidden: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetailFactory.createForbidden(ex.getMessage(), req);
		if (ex.code() != null) pd.setProperty("code", ex.code());
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd); // 403
	}

	@ExceptionHandler({UnauthorizedException.class, AuthenticationException.class})
	public ResponseEntity<ProblemDetail> handleUnauthorized(RuntimeException ex, HttpServletRequest req) {
		log.info("Unauthorized: {}", ex.getMessage());
		String detail = ex.getMessage() != null ? ex.getMessage() : "Authentication required";
		ProblemDetail pd = ProblemDetailFactory.createUnauthorized(detail, req);
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd); // 401
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
		log.info("AccessDenied: {}", ex.getMessage());
		String detail = ex.getMessage() != null ? ex.getMessage() : "Access denied";
		ProblemDetail pd = ProblemDetailFactory.createForbidden(detail, req);
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd); // 403
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest req) {
		log.info("BadRequest: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		pd.setTitle("Bad Request");
		pd.setDetail(ex.getMessage());
		pd.setInstance(URI.create(req.getRequestURI()));
		return ResponseEntity.badRequest().body(pd); // 400
	}

	/** 추가: 비즈니스 상태 충돌/불변 위반 등 */
	@ExceptionHandler(IllegalStateException.class)
	public ResponseEntity<ProblemDetail> handleIllegalState(IllegalStateException ex, HttpServletRequest req) {
		log.info("Conflict(IllegalState): {}", ex.getMessage());
		ProblemDetail pd = ProblemDetailFactory.createConflict(ex.getMessage(), req);
		return ResponseEntity.status(HttpStatus.CONFLICT).body(pd); // 409
	}

	/** 추가: 외부 연동 실패(준비용, 실제 적용은 5단계에서 본격화) */
	@ExceptionHandler(ExternalServiceException.class)
	public ResponseEntity<ProblemDetail> handleExternal(ExternalServiceException ex, HttpServletRequest req) {
		log.error("External service error: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_GATEWAY);
		pd.setTitle("Bad Gateway");
		pd.setDetail(ex.getMessage());
		pd.setInstance(URI.create(req.getRequestURI()));
		return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(pd); // 502
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ProblemDetail> handleGeneric(Exception ex, HttpServletRequest req) {
		log.error("Internal error", ex);
		ProblemDetail pd = ProblemDetailFactory.createInternalError(req);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(pd); // 500
	}
}
