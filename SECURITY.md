# 보안/인증 정책

## 인증 토큰
- JWT 알고리즘: HS256
- 서브젝트: 사용자 이메일
- 시크릿: Base64 인코딩 문자열(jwt.secret), 만료시간(jwt.expiration-ms)

## 전달 방식
- 기본: HttpOnly + Secure + SameSite=None 쿠키(jwt)
- 대체: Authorization: Bearer {token} 헤더도 지원
- 로그인 시 setJwtCookie, 로그아웃/계정 삭제시 clearJwtCookie

## Security 설정
- Stateless 세션, CORS 화이트리스트, CSRF 비활성
- 예외 핸들러: 인증 실패 401 / 인가 실패 403 → application/problem+json
- 현재 anyRequest().permitAll이므로, 컨트롤러/서비스에서 인증 전제를 둔 흐름에서 401/403이 발생
- 보호 경로가 필요하다면 authorizeHttpRequests를 authenticated()/hasRole(...)로 강화

## JWT 검증 흐름
1) JwtAuthenticationFilter가 Authorization 헤더 또는 쿠키에서 토큰 추출
2) 유효성 검증 실패 시 401 설정
3) 이메일(subject)로 UserDetails 조회 후 SecurityContext에 UsernamePasswordAuthenticationToken 설정

## 권한 모델
- 기본 Role: USER, 관리자: ADMIN(선언적으로 사용 가능)
- 게시글 수정/삭제 권한: 작성자 본인 또는 ROLE_ADMIN

## 보안 헤더/쿠키
- 쿠키 속성: HttpOnly, Secure, SameSite=None, Path=/, Max-Age 구성
- 프레임 옵션: sameOrigin (H2-console/내부 frame 필요 시)
- 운영 환경: HTTPS 필수 (SameSite=None + Secure 동작 보장)
