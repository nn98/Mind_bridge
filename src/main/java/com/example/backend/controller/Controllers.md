# 목표와 범위

- 일관 응답/에러 포맷(RFC 7807),  
- 상태코드,  
- 캐시/보안 헤더,  
- 인증 추출,  
- 서비스-컨트롤러 역할 분리,  
- 로깅 규칙 통일

# 컨트롤러 공통 규칙

- ## 요청/응답

  - DTO는 @Valid로 검증, 필드 제약은 DTO에 선언한다.

  - 성공 상태: 생성 201 + Location, 수정/비번변경 204, 삭제 204, 조회 200을 기본으로 통일한다.

- ## 에러 처리

  - 컨트롤러에서 예외를 잡아 ApiResponse.error를 만들지 말고, 전역 Advice에 위임한다. try/catch 제거를 1순위로 진행한다.

  - 서비스에서 도메인 오류는 커스텀 예외(Conflict/NotFound/Forbidden 등)를 던진다.

- ## 인증/인가

  - 인증 필요 엔드포인트는 SecurityUtil.requirePrincipalEmail(authentication)으로 추출한다.

  - 민감 응답에는 Cache-Control: no-store, 필요 시 Vary: Authorization을 추가한다.

- ## 로깅

  - 비밀번호/토큰 등 민감정보는 로그에 남기지 않는다.
