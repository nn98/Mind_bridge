# Mind Bridge 보안·설정·구조 개선 종합 정리 (완료 / TODO)

## 완료(Confirmed)

### 1) 실패 응답 RFC7807(ProblemDetail) 통일
- 컨트롤러 try-catch 제거, 전역 Advice에서 RFC7807(JSON) 일원화. 상태코드 매핑: 400/401/403/404/409/422/502/503/500.
- Spring Security 인증/인가 실패는 EntryPoint/AccessDeniedHandler에서 동일 스키마(JSON) 보장.
- JwtAuthenticationFilter: 토큰 검증 실패 시 ProblemDetail JSON 응답, 토큰 부재는 trace 로그만 남기고 통과(보호 경로에서는 EntryPoint가 401).

### 2) 보호 정책(경로 기반) 적용 및 세부 조정
- permitAll:
  - POST /api/users/register
  - GET  /api/users/availability
  - POST /api/auth/find-id
  - POST /api/auth/login
  - POST /api/auth/reset-password
  - GET  /api/auth/social/** (login, callback)
  - GET  /api/posts/public
  - GET  /api/posts/recent
  - GET  /api/posts/* (단일 {id} 공개 조회)
  - /actuator/health, /error, /favicon.ico
- authenticated:
  - /api/users/account, /api/users/account/**
  - /api/posts/my
  - /api/posts/** (쓰기/수정/삭제 등)
  - /api/chat/**
  - /api/admin/**
  - 그 외 anyRequest().authenticated()로 마감(신규 기본 보호)

### 3) OAuth 설정 키 통일(.properties)
- 키:
  - oauth.google.client-id, oauth.google.client-secret, oauth.google.redirect-uri
  - oauth.kakao.client-id,  oauth.kakao.client-secret,  oauth.kakao.redirect-uri
- 바인딩: OAuthProperties(@ConfigurationProperties(prefix="oauth"))로 통합, 서비스에서 타입 세이프 주입.
- 수동 테스트 완료: /api/auth/social/{provider}/login 302, callback 정상.

### 4) JWT 쿠키 설정 외부화(환경에서 제어)
- application.properties 추가:
  - jwt.cookie.name=jwt
  - jwt.cookie.path=/
  - jwt.cookie.domain=
  - jwt.cookie.same-site=None
  - jwt.cookie.secure=true
  - jwt.cookie.max-age-seconds=86400
- JwtUtil: ResponseCookie로 Set-Cookie 생성(HTTPOnly, SameSite, Secure, Max-Age, Domain, Path).
- 수동 테스트 완료: 로그인/로그아웃 쿠키 동작 확인.

### 5) @AuthenticationPrincipal(expression="username") 제거
- principal 타입 가정 제거, authentication.name 사용으로 표준화.
- 토큰 없음 시 AuthenticationCredentialsNotFoundException → 401 ProblemDetail.

### 6) 메소드 시큐리티 + 서비스 순수화(동시 적용)
- @EnableMethodSecurity(prePostEnabled = true) 활성.
- @PreAuthorize:
  - 게시글 수정/삭제: @postAuth.canModify(#id, authentication.name) or hasRole('ADMIN')
  - 사용자 계정: isAuthenticated() + 컨트롤러에서 authentication.name 사용
- 서비스: SecurityContext 의존 제거(명시 인자만 사용).

### 7) EndpointInventory 도입
- 기동 시 전체 매핑 콘솔/JSON 덤프, 공개/보호 정책 검증 근거로 활용.

### 8) Enum 컨버터 적용
- AvailabilityType 전역 Converter 등록(String→Enum, 대소문자/별칭 허용)으로 400 변환 오류 제거.

### 9) 로깅 정책/PII 마스킹 합의 및 일부 적용
- 레벨: INFO/WARN/ERROR
- 마스킹: 이메일/전화/토큰 등 PII/시크릿

### 10) JWT 키 강건성 원칙 확립
- 최소 32B(256비트)+ Base64 랜덤 키, 레포 금지(환경/시크릿 매니저). dev는 교체 권고.


## TODO(Next)

### A) 외부 API 에러 변환 표준화(서비스→도메인 예외→Advice)
- RestTemplate 예외를 ExternalServiceException으로 변환:
  - 외부 5xx → 502 Bad Gateway
  - 타임아웃/연결실패 → 503 Service Unavailable
  - 외부 4xx → 502로 치환(게이트웨이 실패 의미)
- Advice에서 상태코드 매핑 확정, 메시지는 민감정보/URL 제외.

### B) MapStruct 도입
- 1차: UserMapper → MapStruct(@Mapper, @Named 트림/빈→null, IGNORE 전략)
- 2차: PostMapper(Detail/Summary 변환)
- 빌드타임 생성으로 런타임 오버헤드 없음, 동치 테스트로 회귀 방지.

### C) PII 마스킹 전면 적용
- MaskingUtils 도입 후 로그인 실패/외부 호출 예외/핵심 이벤트 로그에 적용
- INFO/WARN 이상에서 PII 제거, DEBUG/TRACE 제한적 사용

### D) 보호 정책 문서 자동화
- EndpointInventory 결과를 MD/JSON로 커밋, SecurityConfig 매칭과 diff 리뷰
- 신규 엔드포인트 기본 authenticated, 공개는 명시 permitAll

### E) 입력 검증/비즈니스 제약 강화
- @Valid + 커스텀 제약/메시지, 400/422 기준 통일
- ProblemDetail errors 맵 유지로 프런트 일관성 확보

### F) OSIV=off 성능 최적화
- fetch join/projection/DTO 전용 조회로 N+1 방지
- Hibernate 로깅/프로파일링으로 핵심 API 최적화

### G) CORS/쿠키 운영 가이드 확정
- 허용 origin 명시, credentials=true, 헤더 설정 점검
- dev에서는 secure=false 옵션 허용(브라우저 정책 고려)

### H) 감사 로깅(Audit)
- 로그인/로그아웃/권한 거부/자원 변경 이벤트 로깅
- PII 마스킹 일관 유지

### I) 레이트리밋(로그인/비번재설정/소셜콜백)
- IP/계정 기반 제한, 누적 실패 시 지연/차단/429 응답

### J) 테스트 고도화(슬라이스+통합)
- @WebMvcTest: 400/401/403/404/409/422/502/503 ProblemDetail 스냅샷
- @DataJpaTest: 매핑/쿼리 검증
- @SpringBootTest: 핵심 플로우(OAuth, JWT, 보호 경로) 통합

### K) 문서화(정책/스펙/설정/쿠키)
- 보호 정책 표, RFC7807 스키마, 설정 키(.properties), OAuth 플로우, 쿠키 정책, 수동 테스트 가이드

### L) JWT 키 운영(중기)
- kid/JWKs 기반 다중 키 운영/롤링 설계, 교체 유예창 전략

### M) 토큰 전략 개선(선택)
- Access/Refresh 분리(회전·블랙리스트), 재발급/탈취 대응 강화


## 설계 원칙(합의 기준)

- 실패는 RFC7807(JSON), 성공은 도메인 DTO 직반환(래퍼 제거 지향)
- 인증(경로)·인가(메소드) 선언적 분리, 서비스는 보안 비의존 순수 로직
- SpEL에서는 authentication.name만 사용(principal.username 금지)
- 설정은 @ConfigurationProperties로 타입 세이프 주입, prefix는 kebab-case(예: oauth)
- 쿠키 정책은 SameSite/Secure/Domain/Path/HttpOnly/MaxAge 외부화, 운영은 Secure=true
- 키/시크릿은 레포 금지, 환경/시크릿 매니저 관리, 강도/롤링 고려
- OSIV=off 전제, 쿼리/연관 로딩 명시적 최적화
- 테스트는 슬라이스+통합 혼합, 보안/에러 스펙 스냅샷화
