# API 명세

<img width="878" height="590" alt="image" src="https://gist.github.com/user-attachments/assets/41a61c07-2020-47be-a537-41933e60024f" />

공통
- Base URL: /api
- Media Type: application/json (성공), application/problem+json (에러)
- 인증: JWT(HttpOnly 쿠키 'jwt') 또는 Authorization: Bearer {token}
- 에러: RFC 7807 Problem Details(type, title, status, detail, instance, 확장필드)

## 인증
POST /api/auth/login
- Request: LoginRequest { email: string!, password: string!, code?: string }
- Response 200: ApiResponse<LoginResponse> { data: { accessToken, profile{...} }, ... }, Set-Cookie: jwt
- Errors: 401 Unauthorized, 422/400 Validation/Binding
  POST /api/auth/logout
- Response 200: ApiResponse<String>, 쿠키 삭제(Set-Cookie: jwt; Max-Age=0)
  POST /api/auth/find-id
- Request: FindIdRequest { phoneNumber!: string, nickname!: string }
- Response 200: ApiResponse<{email:string(masked)}> | 404
  POST /api/auth/reset-password
- Request: ResetPasswordRequest { email!: string }
- Response 200: ApiResponse<{tempPassword:string}> | 404

## 사용자
POST /api/users/register
- Request: RegistrationRequest { age(1-150)!, email!, password@ValidPassword!, nickname@ValidNickname!, gender!, phoneNumber@ValidPhoneNumber!, termsAccepted:true!, ... }
- Response 201: Location: /api/users/{nickname}, body: Profile
- Errors: 409(중복), 422/400(검증/바인딩)
  GET /api/users/availability?type={NICKNAME|EMAIL}&value={string}
- Response 200: { isAvailable: boolean }
- Errors: 400(잘못된 type)
  GET /api/users/account (Auth)
- Response 200: Profile + Cache-Control: no-store
- Errors: 401, 404
  PATCH /api/users/account (Auth)
- Request: UpdateRequest { nickname(2-20)?, chatGoal<=500?, age?, gender?, ... }
- Response 204
  DELETE /api/users/account (Auth)
- Response 204 + 쿠키 삭제
  PATCH /api/users/account/password (Auth)
- Request: ChangePasswordRequest { currentPassword!, password@ValidPassword!, confirmPassword! }
- Response 204
- Errors: 400(현재 비번 불일치/확인 불일치), 401
  GET /api/users/summary?nickname=...
- Response 200: Summary | 404

## 게시글
GET /api/posts
- Response 200: ApiResponse<List<Detail>>
  GET /api/posts/public
- Response 200: ApiResponse<List<Summary>>
  GET /api/posts/recent?limit=10
- Response 200: ApiResponse<List<Summary>>
  GET /api/posts/user/{email}
- Response 200: ApiResponse<List<Detail>>
  GET /api/posts/my (Auth)
- Response 200: ApiResponse<List<Detail>>
  GET /api/posts/{id}
- Response 200: ApiResponse<Detail> | 404
  POST /api/posts (Auth)
- Request: CreateRequest { content!: string, visibility: "public|private|friends" }
- Response 201: ApiResponse<Detail>
  PUT /api/posts/{id} (Auth)
- Request: UpdateRequest { content?, visibility? }
- Response 200: ApiResponse<Detail>
- Errors: 403(작성자 아님/권한), 404
  DELETE /api/posts/{id} (Auth)
- Response 200: ApiResponse<String>

## 채팅
POST /api/chat/session/start?email=...
- Response 200: ApiResponse<Long> (sessionId)
  POST /api/chat/message (Auth)
- Request: MessageRequest { systemPrompt!: string, userMessage?: string, sessionId?: long }
- Response 200: ApiResponse<MessageResponse> { emotion, counselorResponse, summary, sessionEnd, sessionId }
  POST /api/chat/session/{sessionId}/complete
- Request: query summary?, emotion?, aiSummary?, score?
- Response 200: ApiResponse<String>
  POST /api/chat/session/save
- Request: SessionRequest { userEmail!@Email, userChatSummary<=1000, userEmotionAnalysis<=100, aiResponseSummary<=1000, sessionStatus(default COMPLETED), conversationScore? }
- Response 200: ApiResponse<SessionHistory>
  GET /api/chat/sessions
- Response 200: ApiResponse<List<SessionHistory>>
  GET /api/chat/sessions/count?email=...
- Response 200: ApiResponse<Long>
  GET /api/chat/test/new
- Response: 외부 응답 그대로 프록시(JSON) 또는 외부 에러 그대로 전파

## 에러 응답 예시
422 Validation
{
"type": "https://api.example.com/errors/validation",
"title": "Validation Failed",
"status": 422,
"detail": "One or more fields are invalid",
"instance": "/api/users/register",
"timestamp": "2025-09-08T02:34:56Z",
"errors": { "email": ["올바른 이메일 형식이 아닙니다"] }
}
401 Unauthorized
{
"title": "Unauthorized",
"status": 401,
"detail": "Authentication required",
"instance": "/api/users/account"
}
