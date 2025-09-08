# 아키텍처 개요

```mermaid
mermaid
flowchart TD
    %% Entry
    subgraph Client
        BROWSER[Web/Mobile Client]
    end

    subgraph Backend["Spring Boot 3 Application"]
        direction TB

        %% Security Layer
        subgraph Security["Security Layer"]
            SFC[SecurityFilterChain\n(HttpSecurity)]
            JWTF[JwtAuthenticationFilter\n(Bearer/Cookie)]
            JAH[JsonAuthHandlers\n401/403 → ProblemDetail]
            SFC --> JWTF --> JAH
        end

        %% Web Layer
        subgraph Web["Web Layer (Spring MVC)"]
            CTRL[Controller\n(User/Post/Chat/Auth/SocialAuth)]
            VAL[Validation\n(Bean Validation, @Valid,\n@ValidPassword, @ValidPhoneNumber)]
            ERRH[ProblemDetailsAdvice\n(Global Exception Handler)]
            PDF[ProblemDetailFactory\n(type/title/detail/instance/timestamp)]
            CTRL <-- DTO Binding/Validation --> VAL
            CTRL --> ERRH
            ERRH --> PDF
        end

        %% Service Layer
        subgraph Service["Service Layer"]
            USER_SVC[UserService\n(UserServiceImpl)]
            POST_SVC[PostService\n(PostServiceImpl)]
            CHAT_SVC[ChatService\n(ChatServiceImpl)]
            CHATSES_SVC[ChatSessionService\n(ChatSessionServiceImpl)]
        end

        %% Repository/Data Layer
        subgraph Data["Repository / JPA"]
            USER_REPO[UserRepository]
            POST_REPO[PostRepository]
            CHAT_REPO[ChatMessageRepository]
            CHATSES_REPO[ChatSessionRepository]
            JPA[(Spring Data JPA)]
            USER_REPO --> JPA
            POST_REPO --> JPA
            CHAT_REPO --> JPA
            CHATSES_REPO --> JPA
        end

        %% Entities
        subgraph Domain["Domain / Entities"]
            USER_ENT[UserEntity]
            POST_ENT[PostEntity]
            CHAT_ENT[ChatMessageEntity]
            CHATSES_ENT[ChatSessionEntity]
        end

        %% External Integrations
        subgraph External["External Integrations"]
            OAUTH[Google/Kakao OAuth\n(Authorize/Token/UserInfo)]
            OPENAI[OpenAI API\n(messages, JSON parsing)]
        end
    end

    %% DB
    DB[(MySQL 8.x Database)]

    %% Flows
    BROWSER -->|HTTP Request| SFC
    JAH -->|401/403 ProblemDetail| BROWSER

    SFC --> CTRL
    CTRL -->|DTO 검증 실패(422) / 파라미터/바인딩 실패(400)| ERRH
    CTRL -->|비즈니스 로직| USER_SVC
    CTRL -->|비즈니스 로직| POST_SVC
    CTRL -->|비즈니스 로직| CHAT_SVC
    CTRL -->|비즈니스 로직| CHATSES_SVC

    %% Services to Repos
    USER_SVC --> USER_REPO
    POST_SVC --> POST_REPO
    CHAT_SVC --> CHAT_REPO
    CHATSES_SVC --> CHATSES_REPO

    %% JPA to DB
    JPA --> DB

    %% Entities usage
    USER_REPO --- USER_ENT
    POST_REPO --- POST_ENT
    CHAT_REPO --- CHAT_ENT
    CHATSES_REPO --- CHATSES_ENT

    %% External calls
    CTRL -->|/api/auth/social ...| OAUTH
    CHAT_SVC --> OPENAI

    %% Error standardization
    ERRH -->|ProblemDetail JSON| BROWSER
    PDF -.-> ERRH

    %% Notes
    note over Security,Web: Stateless 인증(세션 비사용), JWT 쿠키/헤더 지원\nRFC 7807 Problem Details로 오류 일원화
    note right of CTRL: Controller: URL/메서드/상태/헤더 계약, 캐시/쿠키 헤더
    note right of Service: Service: 권한/규칙/외부 연동 호출/파싱
    note right of Data: Repository: 파생쿼리/수정쿼리, Entity 매핑

```

## 전체 흐름
- HTTP 요청 → Spring MVC Controller → DTO 검증 → Service 비즈니스 로직 → Repository/JPA → DB(MySQL)
- 인증/인가: SecurityFilterChain + JwtAuthenticationFilter에서 Bearer/쿠키 기반 인증 처리, SecurityContext에 Principal 저장
- 예외/에러: 컨트롤러/서비스 예외는 @RestControllerAdvice에서 ProblemDetail로 매핑, 시큐리티 단계 401/403은 별도 핸들러에서 ProblemDetail JSON으로 확정

## 레이어 책임
- Controller: HTTP 계약(URL/메서드/상태코드/헤더), DTO 바인딩/검증, 캐시/쿠키 헤더 설정
- Service: 비즈니스 규칙, 권한 검증, 외부 연동 호출/파싱
- Repository: 데이터 접근, 파생 쿼리/커스텀 업데이트
- Security: JWT 파싱/검증, CORS, 예외 엔트리 포인트
- Error: ProblemDetail 포맷 일관화, 상태코드 매핑
- Validation: @ValidPassword 등 커스텀 제약 어노테이션과 Validator

## 주요 컴포넌트 매핑
- SecurityFilterChain(SecurityConfig): Stateless, CORS, 예외 핸들러(JsonAuthHandlers), JwtAuthenticationFilter 등록
- JwtAuthenticationFilter: Authorization 헤더/쿠키의 JWT를 검증 후 인증 컨텍스트 설정
- JsonAuthHandlers: 401/403 발생 시 application/problem+json으로 직렬화
- ProblemDetailsAdvice: 422/400/404/409/401/403/500 등 전역 매핑
- ProblemDetailFactory: type/title/detail/instance/timestamp 속성 표준화

## 데이터 모델
- UserEntity: 사용자 핵심 속성(email unique), 역할(role), 소셜 속성(provider, socialId), 감사 필드
- PostEntity: 게시글(내용/공개 범위/집계/상태/인덱스), 작성자 email denorm, User와 LAZY 연관
- ChatSessionEntity/ChatMessageEntity: 세션-메시지 구조, 상태 전이(IN_PROGRESS→COMPLETED)

## 외부 연동
- 소셜 OAuth: Google/Kakao authorize/token/userinfo, 표준 사용자(email,nickname) 추출 → findOrCreate
- OpenAI: ChatServiceImpl에서 messages 프롬프트 구성 → 응답 JSON 파싱 → 실패 시 텍스트 fallback

## 설계 원칙
- 무상태 인증(세션 비사용), 쿠키는 HttpOnly/None/Secure
- DTO/검증으로 계약 강화, 엔티티 직접 노출 금지
- 에러는 RFC 7807, 문서화 가능한 표준 스키마 유지
