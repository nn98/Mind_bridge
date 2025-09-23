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

import com.example.backend.common.error.validation.ValidationErrorProcessor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 전역 예외 처리 - RFC 7807 ProblemDetail JSON 응답
 * 기존 로직 완전 보장 + ValidationErrorProcessor 상세 로깅 추가
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class ProblemDetailsAdvice {

	private final ValidationErrorProcessor validationErrorProcessor;

	private String req(HttpServletRequest req) {
		String qs = req.getQueryString();
		return "%s %s%s".formatted(
			req.getMethod(),
			req.getRequestURI(),
			(qs != null && !qs.isBlank()) ? "?" + qs : ""
		);
	}

	private Throwable rootCause(Throwable ex) {
		Throwable t = ex;
		while (t.getCause() != null && t.getCause() != t) {
			t = t.getCause();
		}
		return t;
	}

	// === 검증 예외들 (기존 로직 완전 보장 + 상세 로깅 추가) ===

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
		// ✅ 기존 로직 완전 유지
		Map<String, List<String>> errors = ex.getBindingResult().getFieldErrors()
			.stream()
			.collect(Collectors.groupingBy(
				FieldError::getField,
				Collectors.mapping(DefaultMessageSourceResolvable::getDefaultMessage, Collectors.toList())
			));

		// ✅ 기존 로그 유지
		log.warn("422 Validation failed: req={}, ex={}, msg={}, errors={}",
			req(req), ex.getClass().getSimpleName(), ex.getMessage(), errors);

		// ✅ 추가 상세 로깅
		validationErrorProcessor.processBindingResult(ex.getBindingResult(), req(req));

		// ✅ 기존 응답 구조 완전 유지
		ProblemDetail pd = ProblemDetailFactory.createValidation("하나 이상의 필드가 유효하지 않습니다.", req);
		pd.setProperty("code", "VALIDATION_FAILED");
		pd.setProperty("errors", errors);

		return ResponseEntity.unprocessableEntity().body(pd);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ProblemDetail> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest req) {
		// ✅ 기존 로직 완전 유지
		Map<String, List<String>> errors = ex.getConstraintViolations()
			.stream()
			.collect(Collectors.groupingBy(
				v -> v.getPropertyPath().toString(),
				Collectors.mapping(ConstraintViolation::getMessage, Collectors.toList())
			));

		// ✅ 기존 로그 유지
		log.warn("400 Constraint violation: req={}, ex={}, msg={}, errors={}",
			req(req), ex.getClass().getSimpleName(), ex.getMessage(), errors);

		// ✅ 추가 상세 로깅
		validationErrorProcessor.processConstraintViolations(ex.getConstraintViolations(), req(req));

		// ✅ 기존 응답 구조 완전 유지
		ProblemDetail pd = ProblemDetailFactory.createBadRequest("하나 이상의 매개변수가 유효하지 않습니다.", req);
		pd.setProperty("code", "CONSTRAINT_VIOLATION");
		pd.setProperty("errors", errors);

		return ResponseEntity.badRequest().body(pd);
	}

	@ExceptionHandler(BindException.class)
	public ResponseEntity<ProblemDetail> handleBind(BindException ex, HttpServletRequest req) {
		// ✅ 기존 로직 완전 유지
		Map<String, List<String>> errors = ex.getBindingResult().getFieldErrors()
			.stream()
			.collect(Collectors.groupingBy(
				FieldError::getField,
				Collectors.mapping(DefaultMessageSourceResolvable::getDefaultMessage, Collectors.toList())
			));

		// ✅ 기존 로그 유지
		log.warn("400 Bind failed: req={}, ex={}, msg={}, errors={}",
			req(req), ex.getClass().getSimpleName(), ex.getMessage(), errors);

		// ✅ 추가 상세 로깅
		validationErrorProcessor.processBindingResult(ex.getBindingResult(), req(req));

		// ✅ 기존 응답 구조 완전 유지
		ProblemDetail pd = ProblemDetailFactory.createBadRequest("바인딩에 실패했습니다.", req);
		pd.setProperty("code", "BINDING_FAILED");
		pd.setProperty("errors", errors);

		return ResponseEntity.badRequest().body(pd);
	}

	// === 모든 기존 예외 핸들러들 완전 동일 유지 ===

	@ExceptionHandler(ConflictException.class)
	public ResponseEntity<ProblemDetail> handleConflict(ConflictException ex, HttpServletRequest req) {
		log.info("409 Conflict: req={}, code={}, field={}, msg={}",
			req(req), ex.code(), ex.field(), ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createConflict(ex.getMessage(), req);
		pd.setProperty("code", ex.code());
		pd.setProperty("field", ex.field());

		return ResponseEntity.status(HttpStatus.CONFLICT).body(pd);
	}

	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<ProblemDetail> handleNotFound(NotFoundException ex, HttpServletRequest req) {
		log.info("404 NotFound: req={}, code={}, field={}, msg={}",
			req(req), ex.code(), ex.field(), ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createNotFound(ex.getMessage(), req);
		pd.setProperty("code", ex.code());
		pd.setProperty("field", ex.field());

		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(pd);
	}

	@ExceptionHandler(BadRequestException.class)
	public ResponseEntity<ProblemDetail> handleBadRequest(BadRequestException ex, HttpServletRequest req) {
		log.info("400 BadRequest: req={}, code={}, field={}, msg={}",
			req(req), ex.getCode(), ex.getField(), ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createBadRequest(ex.getMessage(), req);
		pd.setProperty("code", ex.getCode());
		pd.setProperty("field", ex.getField());

		return ResponseEntity.badRequest().body(pd);
	}

	@ExceptionHandler(ForbiddenException.class)
	public ResponseEntity<ProblemDetail> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
		log.info("403 Forbidden: req={}, code={}, msg={}",
			req(req), ex.code(), ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createForbidden(ex.getMessage(), req);
		pd.setProperty("code", ex.code());

		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd);
	}

	@ExceptionHandler({UnauthorizedException.class, AuthenticationException.class})
	public ResponseEntity<ProblemDetail> handleUnauthorized(RuntimeException ex, HttpServletRequest req) {
		String detail = ex.getMessage() != null ? ex.getMessage() : "인증이 필요합니다.";
		log.info("401 Unauthorized: req={}, ex={}, msg={}",
			req(req), ex.getClass().getSimpleName(), detail);

		ProblemDetail pd = ProblemDetailFactory.createUnauthorized(detail, req);
		pd.setProperty("code", "AUTHENTICATION_REQUIRED");

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd);
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
		String detail = ex.getMessage() != null ? ex.getMessage() : "접근이 거부되었습니다.";
		log.info("403 AccessDenied: req={}, msg={}", req(req), detail);

		ProblemDetail pd = ProblemDetailFactory.createForbidden(detail, req);
		pd.setProperty("code", "ACCESS_DENIED");

		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd);
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest req) {
		log.info("400 IllegalArgument: req={}, msg={}", req(req), ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createBadRequest(ex.getMessage(), req);
		pd.setProperty("code", "INVALID_ARGUMENT");

		return ResponseEntity.badRequest().body(pd);
	}

	@ExceptionHandler(IllegalStateException.class)
	public ResponseEntity<ProblemDetail> handleIllegalState(IllegalStateException ex, HttpServletRequest req) {
		log.info("409 IllegalState: req={}, msg={}", req(req), ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createConflict(ex.getMessage(), req);
		pd.setProperty("code", "INVALID_STATE");

		return ResponseEntity.status(HttpStatus.CONFLICT).body(pd);
	}

	@ExceptionHandler(org.springframework.security.authentication.AuthenticationCredentialsNotFoundException.class)
	public ResponseEntity<ProblemDetail> handleAuthCredentialsMissing(
		org.springframework.security.authentication.AuthenticationCredentialsNotFoundException ex,
		HttpServletRequest req) {
		log.info("401 CredentialsMissing: req={}, msg={}", req(req), ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createUnauthorized(
			ex.getMessage() != null ? ex.getMessage() : "인증이 필요합니다.", req);
		pd.setProperty("code", "CREDENTIALS_MISSING");

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd);
	}

	// 1) JSON 역직렬화/본문 읽기 실패
	@ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
	public ResponseEntity<ProblemDetail> handleNotReadable(
		org.springframework.http.converter.HttpMessageNotReadableException ex, HttpServletRequest req) {

		Throwable root = (ex.getCause() != null) ? ex.getCause() : ex;

		// ✅ 더 상세한 디버깅 로그
		log.warn("400 NotReadable DETAILS: req={}", req(req));
		log.warn("400 NotReadable Exception: {}", ex.getClass().getName());
		log.warn("400 NotReadable Message: {}", ex.getMessage());
		log.warn("400 NotReadable Root Cause: {} - {}", root.getClass().getName(), root.getMessage());

		// ✅ 스택 트레이스도 로깅 (임시)
		log.warn("400 NotReadable Stack Trace:", ex);

		ProblemDetail pd = ProblemDetailFactory.createBadRequest("요청 본문(JSON)을 해석할 수 없습니다.", req);
		pd.setProperty("code", "MALFORMED_JSON");
		pd.setProperty("detailMessage", root.getMessage());
		return ResponseEntity.badRequest().body(pd);
	}

	// 2) @RequestParam/@PathVariable 타입 변환 실패
	@ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ProblemDetail> handleTypeMismatch(
		org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex, HttpServletRequest req) {

		String name = ex.getName();
		String required = (ex.getRequiredType() != null) ? ex.getRequiredType().getSimpleName() : "Unknown";
		log.warn("400 TypeMismatch: req={}, param={}, requiredType={}, msg={}",
			req(req), name, required, ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createBadRequest("요청 파라미터 타입이 올바르지 않습니다.", req);
		pd.setProperty("code", "TYPE_MISMATCH");
		pd.setProperty("param", name);
		pd.setProperty("requiredType", required);
		return ResponseEntity.badRequest().body(pd);
	}

	// 3) 필수 파라미터 누락
	@ExceptionHandler(org.springframework.web.bind.MissingServletRequestParameterException.class)
	public ResponseEntity<ProblemDetail> handleMissingParam(
		org.springframework.web.bind.MissingServletRequestParameterException ex, HttpServletRequest req) {

		log.warn("400 MissingParam: req={}, name={}, type={}, msg={}",
			req(req), ex.getParameterName(), ex.getParameterType(), ex.getMessage());

		ProblemDetail pd = ProblemDetailFactory.createBadRequest("필수 요청 파라미터가 누락되었습니다.", req);
		pd.setProperty("code", "MISSING_PARAMETER");
		pd.setProperty("param", ex.getParameterName());
		pd.setProperty("requiredType", ex.getParameterType());
		return ResponseEntity.badRequest().body(pd);
	}

	// 4) 미지원 미디어타입/메서드 (선택)
	@ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
	public ResponseEntity<ProblemDetail> handleUnsupportedMedia(
		org.springframework.web.HttpMediaTypeNotSupportedException ex, HttpServletRequest req) {

		log.warn("415 UnsupportedMedia: req={}, msg={}", req(req), ex.getMessage());
		ProblemDetail pd = ProblemDetailFactory.create(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
			Errors.TYPE_BAD_REQUEST, "Unsupported Media Type", ex.getMessage(), req);
		pd.setProperty("code", "UNSUPPORTED_MEDIA_TYPE");
		return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(pd);
	}

	// === 최종 fallback (완전 동일) ===

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ProblemDetail> handleGeneric(Exception ex, HttpServletRequest req) {
		Throwable root = rootCause(ex);
		log.error("500 Internal error: req={}, ex={}, msg={}, rootEx={}, rootMsg={}",
			req(req), ex.getClass().getName(), ex.getMessage(),
			root.getClass().getName(), root.getMessage(), ex);

		ProblemDetail pd = ProblemDetailFactory.createInternalError(req);
		pd.setProperty("code", "INTERNAL_ERROR");

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(pd);
	}
}
