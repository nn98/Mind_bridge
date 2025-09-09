# Mind Bridge BE

Mind Bridge BE는 Spring Boot 3 기반의 REST 백엔드 애플리케이션으로 사용자 관리, 게시글 관리, 채팅 세션, 소셜 로그인(Google/Kakao)을 제공한다. 인증은 JWT(쿠키/헤더)를 사용하며, 모든 오류 응답은 RFC 7807 Problem Details(application/problem+json) 형식을 따른다.

## 핵심 기능
- 사용자: 회원가입, 프로필 조회/수정/삭제, 비밀번호 변경(현재 비밀번호 확인 및 정책 검증)
- 인증: 로그인/로그아웃, JWT 쿠키 발급/삭제, 소셜 로그인(Google/Kakao)
- 게시글: 생성/수정/삭제, 공개/개인/친구 공개, 목록/상세/최근/통계
- 채팅: 세션 생성/완료/저장/조회, 메시지 처리(OpenAI 호출 연동), 외부 모델 테스트 프록시
- 에러 처리: 전역 예외 처리기 + 시큐리티 필터 단계 JSON ProblemDetail 일관화

## 기술 스택
- Java 17+, Spring Boot 3.x (Web, Validation, Security, JPA), Lombok
- Database: MySQL 8.x (JPA/Hibernate)
- 외부 연동: Google/Kakao OAuth, OpenAI API
- 문서화: 본 리포지토리의 Markdown 명세(추후 REST Docs/OpenAPI 연계 권장)

## 프로젝트 구조
```java
com.example.backend
├─ common.error/ # 전역 예외 및 ProblemDetail 팩토리
├─ config.properties/ # Properties 바인딩 및 뷰
├─ controller/ # REST 컨트롤러
├─ dto/ # 요청/응답 DTO
├─ entity/ # JPA 엔티티
├─ mapper/ # DTO-Entity/도메인 변환
├─ repository/ # Spring Data JPA 리포지토리
├─ security/ # Security 설정/필터/JWT/유틸
├─ service/ # 서비스 인터페이스
├─ service.impl/ # 서비스 구현체
```

## 빠른 시작
1) 사전 요구사항
- JDK 17+, MySQL 8.x
- 환경 변수 또는 application.properties에 필수 키 설정
    - DB: spring.datasource.url, username, password
    - JWT: jwt.secret(Base64), jwt.expiration-ms
    - 쿠키: jwt.cookie.* (name, secure, sameSite, path, domain, max-age-seconds)
    - OpenAI: openai.api.key, openai.api.url
    - OAuth: oauth.google.client-id, oauth.google.client-secret, oauth.google.redirect-uri, oauth.kakao.client-id, oauth.kakao.redirect-uri, kakao.client-secret(optional)

2) 의존성 설치 및 실행
- Gradle: ./gradlew bootRun
- Maven: mvn spring-boot:run

3) 기본 동작
- 프런트엔드 CORS: http://localhost:3000 및 운영 도메인 허용
- 로그인 성공 시 서버가 JWT HttpOnly+Secure 쿠키를 발급
- 인증이 필요한 API는 JWT 존재 및 유효성 검증을 통과해야 사용 가능

## 환경별 구성 팁
- 로컬 개발: SameSite=None; Secure=true 쿠키는 HTTPS 필요, 브라우저 정책 고려(로컬은 개발자 옵션/프록시 활용 권장)
- 운영 배포: HTTPS 필수, 시크릿은 환경 변수/비밀 관리로 주입
- 도메인/서브도메인 운영 시 CORS 허용 목록/패턴을 적절히 관리

## 문서 가이드
- 아키텍처 개요: ARCHITECTURE.md
- API 상세 명세: API-SPEC.md
- 시큐리티 구성/정책: SECURITY.md
- 에러 포맷/예시: ERROR-HANDLING.md
- 테스트 전략: TESTING.md
- 배포 가이드: DEPLOYMENT.md
- 설정 목록: CONFIGURATION.md
- 기여 가이드: CONTRIBUTING.md
- 설계 결정 기록: ADR-0001-use-problem-details.md
