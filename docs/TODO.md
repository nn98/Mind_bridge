<details><summary><h1>1️⃣🛠️ 개선 : 보안·설정·구조</h1></summary>

> ## 설계 원칙/기준
> - 실패는 RFC7807(JSON), 성공은 도메인 DTO 직반환(래퍼 제거 지향)
> - 인증(경로)·인가(메소드) 선언적 분리, 서비스는 보안 비의존 순수 로직
> - SpEL에서는 authentication.name만 사용(principal.username 금지)
> - 설정은 @ConfigurationProperties로 타입 세이프 주입, prefix는 kebab-case(예: oauth)
> - 쿠키 정책은 SameSite/Secure/Domain/Path/HttpOnly/MaxAge 외부화, 운영은 Secure=true
> - 키/시크릿은 레포 금지, 환경/시크릿 매니저 관리, 강도/롤링 고려
> - OSIV=off 전제, 쿼리/연관 로딩 명시적 최적화
> - 테스트는 슬라이스+통합 혼합, 보안/에러 스펙 스냅샷화

## Done(Confirmed)

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
  - [X] 게시글 권한 확인
    - 게시글 수정/삭제: @postAuth.canModify(#id, authentication.name) or hasRole('ADMIN')
  - [X] 사용자 계정 권한 확인
    - 사용자 계정: isAuthenticated() + 컨트롤러에서 authentication.name 사용
- 서비스: SecurityContext 의존 제거(명시 인자만 사용).
  - [X] PostServiceImpl에서 SecurityContext 접근 제거
  - [X] UserServiceImpl는 이미 이메일 인자를 받아 동작하므로 변경 최소

### 7) EndpointInventory 도입
- 기동 시 전체 매핑 콘솔/JSON 덤프, 공개/보호 정책 검증 근거로 활용.

### 8) Enum 컨버터 적용
- AvailabilityType 전역 Converter 등록(String→Enum, 대소문자/별칭 허용)으로 400 변환 오류 제거.

### 9) 로깅 정책/PII 마스킹 합의 및 일부 적용
- 레벨: INFO/WARN/ERROR
- 마스킹: 이메일/전화/토큰 등 PII/시크릿

### 10) JWT 키 강건성 원칙 확립
- 최소 32B(256비트)+ Base64 랜덤 키, 레포 금지(환경/시크릿 매니저). dev는 교체 권고.

------------------------------------------------------------------------------------

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
</details> 

----------------------------------------------------------------------------------------------

<details><summary><h1>2️⃣🧪 기능 : 추가·보완·이관</h1></summary>

# 원칙
- 책임, 역할, 효율에 따라 정해진 기능을 분리 분담
- 각각의 전담 기능을 효과적으로 수행할 수 있도록
- 각각의 책임에 맞는 기능을 수행하며 낮은 결합도 유지, 유지보수성 제고

## 기능 이관
### 1) 관리자 페이지 기능
- [X] #### a. 사용자 통계
- [X] #### b. 게시글 통계
- [X] #### c. 트래픽 통계
- [X] #### d. 채팅 통계
> 전 : 전체 리스트를 요청한 클라이언트가 직접 조작  
> 후 : 정해진 기준과 조건에 맞춰 서버가 응답 

</details>

----------------------------------------------------------------------------------------------

<details><summary><h1>3️⃣🛠️ 개선 : 최신화</h1></summary>

# TODO 최신화 및 우선순위 재설정

## 🚨 High Priority (즉시 개선 필요)

### N1) 성능 모니터링 체계 구축
**application.properties 추가 설정:**

```
# HTTP 서버 요청 퍼센타일과 히스토그램 활성화 (Spring Boot 3.x 권장)
management.metrics.distribution.percentiles.http.server.requests=0.5,0.95,0.99
management.metrics.distribution.percentiles-histogram.http.server.requests=true

# 분포 범위 힌트 (퍼센타일 수렴 안정화)
management.metrics.distribution.minimum-expected-value.http.server.requests=1ms
management.metrics.distribution.maximum-expected-value.http.server.requests=5s

# URI 태그 제한 완화
management.metrics.web.server.max-uri-tags=200
```

- **근거**: 현재 p95/p99가 null로 긴 꼬리 분석 불가, 성능 병목점 식별 제한
- **목표**: 백분위수 기반 성능 대시보드 구축, SLA 기준선 설정 (p95 < 100ms, p99 < 200ms)

### N2) 인증 경로 성능 최적화
**현재 성능 이슈:**
- `/api/auth/login` POST 200: 평균 196ms → 목표 50ms 이하
- `/api/users/account/password` PATCH 500: 평균 180ms, 8건 에러 → 원인 분석 필요

**작업 항목:**
- [ ] 비밀번호 해시 비용 조정 (BCrypt rounds 검토)
- [ ] 인증 관련 DB 쿼리 최적화 및 인덱스 확인
- [ ] 불필요한 I/O 제거 (외부 API 호출 최적화)
- [ ] 500 에러 상세 로깅 및 원인 분석

### N3) 에러 처리 강화
**식별된 문제점:**
- **UNKNOWN URI** (20건 401, 2건 403): 보안 필터 정책 검토 필요
- **RequestRejectedException** (10건 400): 요청 검증 규칙 최적화 필요
- 500 에러에 대한 상세 모니터링 부족

**작업 항목:**
- [ ] 보안 필터 체인 분석 및 UNKNOWN 매핑 개선
- [ ] 요청 거부 정책 세밀화 (불필요한 차단 제거)
- [ ] 500 에러 실시간 알림 체계 구축
- [ ] 에러 로그 PII 마스킹 적용

## 🔧 Medium Priority (단계적 개선)

### M1) 기존 TODO A~C 우선 진행
- **A) 외부 API 에러 변환 표준화**: OpenAI API 실패 시 502/503 매핑
- **B) MapStruct 도입**: UserMapper 성능 개선
- **C) PII 마스킹 전면 적용**: 로그인 실패 로그 보안 강화

### M2) 테스트 커버리지 향상
- [ ] 현재 JaCoCo 설정 활용하여 80% 커버리지 달성
- [ ] 성능 회귀 방지를 위한 응답시간 테스트 추가
- [ ] 500 에러 시나리오 재현 테스트 작성
- [ ] 부하 테스트 JMeter 스크립트 작성

### M3) CORS/보안 정책 세밀화
- [ ] 현재 SameSite=None, Secure=true 설정 운영 환경 검증
- [ ] 허용 Origin 명시적 제한 (와일드카드 제거)
- [ ] 레이트 리미팅 도입 (로그인 시도, 비밀번호 재설정)

## 📊 New Priority (성능 기반 추가)

### N4) 실시간 성능 대시보드
**HttpMetricsDumpController 활용한 성능 알림:**

```
@Scheduled(fixedRate = 300000) // 5분마다
public void checkPerformanceThresholds() {
    // p95 > 100ms 또는 에러율 > 5% 시 알림
    // Slack/Email 통합
}
```

### N5) 데이터베이스 성능 최적화
**현재 설정 검토:**
- HikariCP: max=20, min=5 → 부하에 따른 튜닝 필요
- 커넥션 풀 모니터링 강화
- 느린 쿼리 로깅 활성화 (>100ms)
- 인덱스 최적화 (특히 인증/사용자 조회 쿼리)

### N6) 캐싱 전략 도입
- [ ] 사용자 프로필 조회 Redis 캐싱 (TTL 15분)
- [ ] 공개 게시글 목록 캐싱 (TTL 5분)
- [ ] JWT 토큰 블랙리스트 Redis 캐싱
- [ ] OpenAI API 응답 캐싱 (동일 요청 1시간)

## 📋 기존 TODO 우선순위 조정

### 상향 조정 (성능 영향도 高)
- **F) OSIV=off 성능 최적화** → High Priority
  - fetch join/projection/DTO 전용 조회로 N+1 방지
  - Hibernate 로깅으로 핵심 API 최적화
- **I) 레이트리밋** → Medium Priority
  - IP/계정 기반 제한, 429 응답

### 유지 (기존 우선순위)
- **D) 보호 정책 문서 자동화** → Medium Priority
- **E) 입력 검증/비즈니스 제약 강화** → Medium Priority
- **G) CORS/쿠키 운영 가이드** → Medium Priority
- **H) 감사 로깅(Audit)** → Medium Priority
- **J~M) 테스트/문서화/JWT 개선** → Low Priority

## 🎯 단기 실행 계획 (2주)

### Week 1
- **Day 1-2**: N1 완료 (퍼센타일 모니터링 구축)
- **Day 3-5**: N2 진행 (인증 경로 성능 최적화)

### Week 2
- **Day 1-3**: N3 완료 (에러 처리 강화)
- **Day 4-5**: M1 시작 (외부 API 에러 표준화)

## 📈 성공 지표

### 성능 목표
- **평균 응답시간**: 90% 이상 엔드포인트 50ms 이하
- **백분위수**: p95 < 100ms, p99 < 200ms
- **인증 경로**: 로그인 평균 50ms 이하

### 가용성 목표
- **5xx 에러율**: 1% 이하 유지
- **4xx 에러**: 불필요한 차단 50% 감소

### 보안/품질 목표
- **PII 노출**: 0건 유지
- **테스트 커버리지**: 80% 이상 달성
- **모니터링**: 실시간 성능 알림 체계 구축

## 🔄 지속적 개선

### 주간 검토
- 성능 지표 트렌드 분석
- 에러율 및 신규 병목점 식별
- 사용자 피드백 반영

### 월간 검토
- SLA 달성률 평가
- 아키텍처 개선 방향 논의
- 기술 부채 우선순위 재조정
```

</details>