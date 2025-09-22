# ADR-0001: Use RFC 7807 Problem Details

## 상태
- 승인

## 문맥
- 다양한 예외 발생 지점(컨트롤러/시큐리티/서비스)에서 에러 포맷 일관 필요
- 클라이언트(웹/모바일)에서 기계적 파싱을 위한 표준 스키마 요구

## 결정
- spring.mvc.problemdetails.enabled=true
- 전역 예외는 @RestControllerAdvice + ProblemDetailFactory
- 시큐리티 단계(401/403)는 전용 핸들러에서 application/problem+json 직렬화

## 결과
- 테스트/문서/클라이언트 파싱 일관성 향상
- 모든 오류 응답은 title/status/detail/instance/type 제공, 확장 필드로 errors/code/field 허용
