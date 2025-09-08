# 에러 처리와 Problem Details

## 표준
- spring.mvc.problemdetails.enabled=true 전제
- application/problem+json, RFC 7807 스키마(type, title, status, detail, instance)
- 확장 필드: timestamp, errors(필드별 메시지), code, field 등

## 전역 매핑 표
- 422: MethodArgumentNotValidException(@RequestBody 검증 실패)
- 400: ConstraintViolationException(@RequestParam/@PathVariable 검증 실패), BindException(@ModelAttribute 바인딩 실패), IllegalArgumentException
- 401: UnauthorizedException, AuthenticationException(컨트롤러까지 전파된 경우)
- 403: ForbiddenException, AccessDeniedException(컨트롤러까지 전파된 경우)
- 404: NotFoundException
- 409: ConflictException
- 500: Exception(최종 안전망)

## 시큐리티 단계
- 인증/인가 예외는 Security 필터에서 EntryPoint/DeniedHandler로 처리되어 ProblemDetail JSON으로 즉시 응답

## 예시
- 409 Conflict (중복 닉네임)
  {
  "type": "https://api.example.com/errors/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "이미 사용중인 닉네임입니다.",
  "instance": "/api/users/register",
  "timestamp": "2025-09-08T02:35:12Z",
  "field": "nickname",
  "code": "nickname.duplicate"
  }
