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
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ControllerAdvice
public class ProblemDetailsAdvice {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
		log.error("Validation 실패: {}", ex.getMessage()); // 추가

		ProblemDetail pd = ProblemDetailFactory.createValidation("One or more fields are invalid", req);
		Map<String, List<String>> errors = ex.getBindingResult().getFieldErrors().stream()
			.collect(Collectors.groupingBy(FieldError::getField,
				Collectors.mapping(DefaultMessageSourceResolvable::getDefaultMessage, Collectors.toList())));

		log.error("필드 에러들: {}", errors); // 추가

		pd.setProperty("errors", errors);
		return ResponseEntity.unprocessableEntity().body(pd);
	}


	@ExceptionHandler(ConflictException.class)
	public ResponseEntity<ProblemDetail> handleConflict(ConflictException ex, HttpServletRequest req) {
		// ✅ 팩토리 사용
		ProblemDetail pd = ProblemDetailFactory.createConflict(ex.getMessage(), req);

		if (ex.code() != null) pd.setProperty("code", ex.code());
		if (ex.field() != null) pd.setProperty("field", ex.field());

		return ResponseEntity.status(HttpStatus.CONFLICT).body(pd);
	}

	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<ProblemDetail> handleNotFound(NotFoundException ex, HttpServletRequest req) {
		// ✅ 팩토리 사용
		ProblemDetail pd = ProblemDetailFactory.createNotFound(ex.getMessage(), req);

		if (ex.code() != null) pd.setProperty("code", ex.code());
		if (ex.field() != null) pd.setProperty("field", ex.field());

		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(pd);
	}

	@ExceptionHandler(ForbiddenException.class)
	public ResponseEntity<ProblemDetail> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
		// ✅ 팩토리 사용
		ProblemDetail pd = ProblemDetailFactory.createForbidden(ex.getMessage(), req);

		if (ex.code() != null) pd.setProperty("code", ex.code());

		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd);
	}

	@ExceptionHandler({UnauthorizedException.class, AuthenticationException.class})
	public ResponseEntity<ProblemDetail> handleUnauthorized(RuntimeException ex, HttpServletRequest req) {
		// ✅ 팩토리 사용
		String detail = ex.getMessage() != null ? ex.getMessage() : "Authentication required";
		ProblemDetail pd = ProblemDetailFactory.createUnauthorized(detail, req);

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd);
	}

	// 🆕 AccessDeniedException 핸들러 추가
	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
		// ✅ 팩토리 사용
		String detail = ex.getMessage() != null ? ex.getMessage() : "Access denied";
		ProblemDetail pd = ProblemDetailFactory.createForbidden(detail, req);

		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ProblemDetail> handleGeneric(Exception ex, HttpServletRequest req) {
		// ✅ 팩토리 사용
		ProblemDetail pd = ProblemDetailFactory.createInternalError(req);

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(pd);
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest req) {
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
		pd.setTitle("Bad Request");
		pd.setDetail(ex.getMessage());
		pd.setInstance(URI.create(req.getRequestURI()));
		return ResponseEntity.badRequest().body(pd);
	}
}
