# GOAL

쿠키 속성들을 모두 외부 설정으로 분리해 로컬/운영에서 유연하게 제어. security·CORS 정책과 충돌 없이 동작.

필터 단계/컨트롤러 단계 모두 기존 로직 동치 유지. 실패 응답은 ProblemDetail로 계속 일관.

* * *

# Consider 

- cookieSameSite는 “None”, “Lax”, “Strict” 중 정책에 맞게 properties로만 제어.

- cookieDomain은 크로스 도메인 공유가 필요할 때만 설정. 기본은 빈 값으로 두면 브라우저가 현재 호스트 기준으로 처리.

- secure=true는 운영에서 강제 권장. 로컬(HTTP)에서 쿠키가 안 붙으면 secure=false로만 내려 조정 가능.

- ### JwtAuthenticationFilter는 변경 없음
  - 필터는 Authorization 헤더와 쿠키에서 토큰을 읽는데, 쿠키 이름을 JwtUtil이 프로퍼티로 갖도록 했으므로,  
    resolveToken 내부에서 jwtCookieName을 참조하도록 이미 반영되어 있다. 추가 변경 불필요.

* * *

# Manual Test

- ### Checklist 체크리스트
  
- 로그인 성공

  - 응답 헤더 Set-Cookie에 name=jwt, HttpOnly, SameSite=None, Secure=true(기본), Path=/, Max-Age=86400 포함

  - 프런트에서 withCredentials: true + CORS 응답에 Access-Control-Allow-Credentials=true가 있어야 쿠키 저장 및 전송

- 로컬에서 쿠키가 안 붙는다면

  - 브라우저 정책(HTTP + SameSite=None + Secure=true 조합)을 점검.  
    필요 시 jwt.cookie.secure=false로 임시 전환, 또는 로컬 프록시로 HTTPS 환경 구성

- 로그아웃

  - Set-Cookie: jwt=; Max-Age=0; Path=/; SameSite=None; Secure=... 로 삭제 확인

- 보호 엔드포인트 접근

  - 쿠키 전송 시 인증 OK → 200

  - 쿠키 미전송/토큰 불량 → 401 ProblemDetail(JSON)

* * *

# Design commentary

- 왜 ResponseCookie를 사용하나?

  - Spring의 표준이며 SameSite 속성을 명시적으로 지원한다.  
    javax.servlet.http.Cookie는 SameSite가 표준화되어 있지 않아 헤더 직접 조립이 필요.  
    ResponseCookie가 가독성과 안전성에서 우수.

- 왜 Secure=true를 권장하나?

  - SameSite=None을 쓰는 경우 표준적으로 Secure=true가 요구되고, 
    HTTPS 전송만 허용해 세션 하이재킹 위험을 낮춘다. 운영 환경에서 필수.

- Domain을 비워두는 이유?

  - 기본 호스트로 제한해야 쿠키 범위가 최소화된다. 
    여러 서브도메인에서 공유해야 할 때만 domain=.example.com 같은 값을 지정.

