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

	/**
	 * @RequestBody Bean Validation 실패(필드 단위)
	 * - 상태코드: 422 Unprocessable Entity
	 * - errors: { fieldName: [message1, message2, ...] }
	 */
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

	/**
	 * @RequestParam / @PathVariable 검증 실패(메서드 파라미터 수준)
	 * - 상태코드: 400 Bad Request (팀 정책에 따라 422로 통일 가능)
	 */
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

	/**
	 * 바인딩 실패(@ModelAttribute 등)
	 * - 상태코드: 400 Bad Request
	 */
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

	/**
	 * 도메인 충돌(중복 등)
	 * - 상태코드: 409 Conflict
	 */
	@ExceptionHandler(ConflictException.class)
	public ResponseEntity<ProblemDetail> handleConflict(ConflictException ex, HttpServletRequest req) {
		log.info("Conflict: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetailFactory.createConflict(ex.getMessage(), req);
		if (ex.code() != null) pd.setProperty("code", ex.code());
		if (ex.field() != null) pd.setProperty("field", ex.field());
		return ResponseEntity.status(HttpStatus.CONFLICT).body(pd); // 409
	}

	/**
	 * 리소스 미발견
	 * - 상태코드: 404 Not Found
	 */
	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<ProblemDetail> handleNotFound(NotFoundException ex, HttpServletRequest req) {
		log.info("NotFound: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetailFactory.createNotFound(ex.getMessage(), req);
		if (ex.code() != null) pd.setProperty("code", ex.code());
		if (ex.field() != null) pd.setProperty("field", ex.field());
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(pd); // 404
	}

	/**
	 * 접근 금지(도메인 정책)
	 * - 상태코드: 403 Forbidden
	 */
	@ExceptionHandler(ForbiddenException.class)
	public ResponseEntity<ProblemDetail> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
		log.info("Forbidden: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetailFactory.createForbidden(ex.getMessage(), req);
		if (ex.code() != null) pd.setProperty("code", ex.code());
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd); // 403
	}

	/**
	 * 인증 실패(컨트롤러까지 전파된 경우)
	 * - 상태코드: 401 Unauthorized
	 * - 주의: Security Filter 단계에서 처리되면 본 핸들러까지 도달하지 않을 수 있음
	 */
	@ExceptionHandler({UnauthorizedException.class, AuthenticationException.class})
	public ResponseEntity<ProblemDetail> handleUnauthorized(RuntimeException ex, HttpServletRequest req) {
		log.info("Unauthorized: {}", ex.getMessage());
		String detail = ex.getMessage() != null ? ex.getMessage() : "Authentication required";
		ProblemDetail pd = ProblemDetailFactory.createUnauthorized(detail, req);
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd); // 401
	}

	/**
	 * 인가 실패(컨트롤러까지 전파된 경우)
	 * - 상태코드: 403 Forbidden
	 * - 주의: Security Filter 단계에서 처리되면 본 핸들러까지 도달하지 않을 수 있음
	 */
	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
		log.info("AccessDenied: {}", ex.getMessage());
		String detail = ex.getMessage() != null ? ex.getMessage() : "Access denied";
		ProblemDetail pd = ProblemDetailFactory.createForbidden(detail, req);
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd); // 403
	}

	/**
	 * 잘못된 요청 파라미터/상태
	 * - 상태코드: 400 Bad Request
	 */
	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest req) {
		log.info("BadRequest: {}", ex.getMessage());
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		pd.setTitle("Bad Request");
		pd.setDetail(ex.getMessage());
		pd.setInstance(URI.create(req.getRequestURI()));
		return ResponseEntity.badRequest().body(pd); // 400
	}

	/**
	 * 최종 안전망
	 * - 상태코드: 500 Internal Server Error
	 * - 스택트레이스는 서버 로그에만 기록(민감정보 주의)
	 */
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ProblemDetail> handleGeneric(Exception ex, HttpServletRequest req) {
		log.error("Internal error", ex);
		ProblemDetail pd = ProblemDetailFactory.createInternalError(req);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(pd); // 500
	}
}
