package com.example.backend.common.error;

import jakarta.servlet.http.HttpServletRequest;
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

import java.net.URI;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class ProblemDetailsAdvice {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
		pd.setType(Errors.TYPE_VALIDATION);
		pd.setTitle("Validation Failed");
		pd.setDetail("One or more fields are invalid");
		pd.setInstance(URI.create(req.getRequestURI()));
		Map<String, Object> errors = ex.getBindingResult().getFieldErrors().stream()
			.collect(Collectors.groupingBy(FieldError::getField,
				Collectors.mapping(DefaultMessageSourceResolvable::getDefaultMessage, Collectors.toList())));
		pd.setProperty("errors", errors);
		return ResponseEntity.unprocessableEntity().body(pd);
	}

	@ExceptionHandler(ConflictException.class)
	public ResponseEntity<ProblemDetail> handleConflict(ConflictException ex, HttpServletRequest req) {
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.CONFLICT);
		pd.setType(Errors.TYPE_CONFLICT);
		pd.setTitle("Conflict");
		pd.setDetail(ex.getMessage());
		pd.setInstance(URI.create(req.getRequestURI()));
		if (ex.code() != null) pd.setProperty("code", ex.code());
		if (ex.field() != null) pd.setProperty("field", ex.field());
		return ResponseEntity.status(HttpStatus.CONFLICT).body(pd);
	}

	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<ProblemDetail> handleNotFound(NotFoundException ex, HttpServletRequest req) {
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
		pd.setType(Errors.TYPE_NOT_FOUND);
		pd.setTitle("Not Found");
		pd.setDetail(ex.getMessage());
		pd.setInstance(URI.create(req.getRequestURI()));
		if (ex.code() != null) pd.setProperty("code", ex.code());
		if (ex.field() != null) pd.setProperty("field", ex.field());
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(pd);
	}

	@ExceptionHandler(ForbiddenException.class)
	public ResponseEntity<ProblemDetail> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
		pd.setType(Errors.TYPE_FORBIDDEN);
		pd.setTitle("Forbidden");
		pd.setDetail(ex.getMessage());
		pd.setInstance(URI.create(req.getRequestURI()));
		if (ex.code() != null) pd.setProperty("code", ex.code());
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd);
	}

	@ExceptionHandler({UnauthorizedException.class, AuthenticationException.class})
	public ResponseEntity<ProblemDetail> handleUnauthorized(RuntimeException ex, HttpServletRequest req) {
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
		pd.setType(Errors.TYPE_UNAUTHORIZED);
		pd.setTitle("Unauthorized");
		pd.setDetail(ex.getMessage() != null ? ex.getMessage() : "Authentication required");
		pd.setInstance(URI.create(req.getRequestURI()));
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ProblemDetail> handleGeneric(Exception ex, HttpServletRequest req) {
		ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
		pd.setTitle("Internal Server Error");
		pd.setDetail("Unexpected error occurred");
		pd.setInstance(URI.create(req.getRequestURI()));
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(pd);
	}
}
