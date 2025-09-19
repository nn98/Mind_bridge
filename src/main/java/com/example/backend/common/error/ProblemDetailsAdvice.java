// common/error/ProblemDetailsAdvice.java
package com.example.backend.common.error;

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
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

/**
 * 전역 예외 처리 - RFC 7807 ProblemDetail JSON 응답
 */
@Slf4j
@RestControllerAdvice
public class ProblemDetailsAdvice {

	// === 검증 예외들 ===

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
		log.warn("Validation failed: {}", ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createValidation("하나 이상의 필드가 유효하지 않습니다.", req);

		Map<String, List<String>> errors = ex.getBindingResult().getFieldErrors()
			.stream()
			.collect(Collectors.groupingBy(
				FieldError::getField,
				Collectors.mapping(DefaultMessageSourceResolvable::getDefaultMessage, Collectors.toList())
			));

		pd.setProperty("code", "VALIDATION_FAILED");
		pd.setProperty("errors", errors);

		return ResponseEntity.unprocessableEntity().body(pd); // 422
	}

	// ✅ ConstraintViolationException 핸들러 하나로 통합
	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ProblemDetail> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest req) {
		log.warn("Constraint violation: {}", ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createBadRequest("하나 이상의 매개변수가 유효하지 않습니다.", req);

		Map<String, List<String>> errors = ex.getConstraintViolations()
			.stream()
			.collect(Collectors.groupingBy(
				v -> v.getPropertyPath().toString(),
				Collectors.mapping(ConstraintViolation::getMessage, Collectors.toList())
			));

		pd.setProperty("code", "CONSTRAINT_VIOLATION");
		pd.setProperty("errors", errors);

		return ResponseEntity.badRequest().body(pd); // 400
	}

	@ExceptionHandler(BindException.class)
	public ResponseEntity<ProblemDetail> handleBind(BindException ex, HttpServletRequest req) {
		log.warn("Bind failed: {}", ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createBadRequest("바인딩에 실패했습니다.", req);

		Map<String, List<String>> errors = ex.getBindingResult().getFieldErrors()
			.stream()
			.collect(Collectors.groupingBy(
				FieldError::getField,
				Collectors.mapping(DefaultMessageSourceResolvable::getDefaultMessage, Collectors.toList())
			));

		pd.setProperty("code", "BINDING_FAILED");
		pd.setProperty("errors", errors);

		return ResponseEntity.badRequest().body(pd); // 400
	}

	// === 도메인 예외들 ===

	@ExceptionHandler(ConflictException.class)
	public ResponseEntity<ProblemDetail> handleConflict(ConflictException ex, HttpServletRequest req) {
		log.info("Conflict: {}", ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createConflict(ex.getMessage(), req);
		pd.setProperty("code", ex.code());
		pd.setProperty("field", ex.field());

		return ResponseEntity.status(HttpStatus.CONFLICT).body(pd); // 409
	}

	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<ProblemDetail> handleNotFound(NotFoundException ex, HttpServletRequest req) {
		log.info("Not found: {}", ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createNotFound(ex.getMessage(), req);
		pd.setProperty("code", ex.code());
		pd.setProperty("field", ex.field());

		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(pd); // 404
	}

	// ✅ BadRequestException 추가
	@ExceptionHandler(BadRequestException.class)
	public ResponseEntity<ProblemDetail> handleBadRequest(BadRequestException ex, HttpServletRequest req) {
		log.info("Bad request: {}", ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createBadRequest(ex.getMessage(), req);
		pd.setProperty("code", ex.getCode());
		pd.setProperty("field", ex.getField());

		return ResponseEntity.badRequest().body(pd); // 400
	}

	@ExceptionHandler(ForbiddenException.class)
	public ResponseEntity<ProblemDetail> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
		log.info("Forbidden: {}", ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createForbidden(ex.getMessage(), req);
		pd.setProperty("code", ex.code());

		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd); // 403
	}

	@ExceptionHandler({UnauthorizedException.class, AuthenticationException.class})
	public ResponseEntity<ProblemDetail> handleUnauthorized(RuntimeException ex, HttpServletRequest req) {
		log.info("Unauthorized: {}", ex.getMessage());

		String detail = ex.getMessage() != null ? ex.getMessage() : "인증이 필요합니다.";
		ProblemDetail pd = ProblemDetailFactory.createUnauthorized(detail, req);
		pd.setProperty("code", "AUTHENTICATION_REQUIRED");

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd); // 401
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
		log.info("Access denied: {}", ex.getMessage());

		String detail = ex.getMessage() != null ? ex.getMessage() : "접근이 거부되었습니다.";
		ProblemDetail pd = ProblemDetailFactory.createForbidden(detail, req);
		pd.setProperty("code", "ACCESS_DENIED");

		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd); // 403
	}

	// === 일반 예외들 ===

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest req) {
		log.info("Bad request: {}", ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createBadRequest(ex.getMessage(), req);
		pd.setProperty("code", "INVALID_ARGUMENT");

		return ResponseEntity.badRequest().body(pd); // 400
	}

	@ExceptionHandler(IllegalStateException.class)
	public ResponseEntity<ProblemDetail> handleIllegalState(IllegalStateException ex, HttpServletRequest req) {
		log.info("Conflict (IllegalState): {}", ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createConflict(ex.getMessage(), req);
		pd.setProperty("code", "INVALID_STATE");

		return ResponseEntity.status(HttpStatus.CONFLICT).body(pd); // 409
	}

	@ExceptionHandler(org.springframework.security.authentication.AuthenticationCredentialsNotFoundException.class)
	public ResponseEntity<ProblemDetail> handleAuthCredentialsMissing(
		org.springframework.security.authentication.AuthenticationCredentialsNotFoundException ex,
		HttpServletRequest req) {
		log.info("Unauthorized (credentials-missing): {}", ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createUnauthorized(
			ex.getMessage() != null ? ex.getMessage() : "인증이 필요합니다.", req);
		pd.setProperty("code", "CREDENTIALS_MISSING");

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd); // 401
	}

	// === 최종 fallback ===

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ProblemDetail> handleGeneric(Exception ex, HttpServletRequest req) {
		log.error("Internal error", ex);

		ProblemDetail pd = ProblemDetailFactory.createInternalError(req);
		pd.setProperty("code", "INTERNAL_ERROR");

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(pd); // 500
	}
}
