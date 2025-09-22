# 배포 가이드

## 환경 변수
- DB: spring.datasource.url, username, password, ddl-auto(optional)
- JWT: jwt.secret(Base64), jwt.expiration-ms
- JWT 쿠키: jwt.cookie.name, secure, samesite(None), path(/), domain(옵션), max-age-seconds
- OpenAI: openai.api.key, openai.api.url
- OAuth: oauth.google.client-id/secret/redirect.uri, oauth.kakao.client-id/client-secret/redirect.uri
- 프런트 리다이렉트: app.front.success-url, app.front.error-url

## 런타임
- Java 17, 메모리/스레드 풀은 기본 운영 프로파일에 맞춰 조정
- 로그: 접근 로그/Nginx 리버스 프록시 권장, X-Forwarded-* 신뢰 설정

## 네트워킹
- HTTPS 필수(SameSite=None + Secure 쿠키 위해), 프록시에서 TLS 종료 시 X-Forwarded-Proto 설정
- CORS: 운영 프런트 도메인 화이트리스트; 패턴 허용이 필요하면 allowedOriginPatterns 사용

## 보안
- 시크릿/키는 환경 변수 또는 비밀 관리에 저장
- HSTS/CSP/보안 헤더는 프록시/서블릿 필터 레벨에서 보강
