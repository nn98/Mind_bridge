# 설정 목록

## JWT
- jwt.secret: Base64 인코딩 키 문자열
- jwt.expiration-ms: 만료(ms)
- jwt.cookie.name: jwt
- jwt.cookie.secure: true
- jwt.cookie.samesite: None
- jwt.cookie.path: /
- jwt.cookie.domain: (옵션)
- jwt.cookie.max-age-seconds: 3600

## OpenAI
- openai.api.key: Bearer 토큰
- openai.api.url: 모델 엔드포인트 URL

## OAuth
- google.rest.api.key / google.rest.api.secret / google.redirect.uri
- kakao.rest.api.key / kakao.client-secret / kakao.redirect.uri

## CORS
- 허용 Origin: http://localhost:3000, 운영 프런트 도메인
- 허용 메서드: GET, POST, PUT, PATCH, DELETE, OPTIONS
- 허용 헤더: Authorization, Content-Type, X-Requested-With, Accept, Origin
- allowCredentials: true

## DB
- spring.datasource.url: jdbc:mysql://host:3306/db?...
- spring.datasource.username/password
- spring.jpa.hibernate.ddl-auto: validate|update|none
