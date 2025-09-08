# 기여 가이드

## 브랜치/커밋
- main: 안정 릴리스
- feature/*: 기능 브랜치
- fix/*: 버그 수정
- 커밋 메시지: feat/fix/docs/test/chore 형식 + 한글/영문 요약

## 코드 스타일
- DTO/엔티티/서비스/리포지토리 레이어 분리
- 컨트롤러는 DTO와 상태코드 계약 유지, 엔티티 직접 노출 금지
- 예외는 ProblemDetail에 매핑되도록 표준 예외 사용/전파

## 테스트
- 신규 API는 슬라이스/통합 테스트 동반
- 에러 케이스(400/401/403/404/409/422) 포함
- 시큐리티 필터 경로가 필요한 경우 addFilters=true

## 문서 동기화
- API 변경 시 API-SPEC.md, ERROR-HANDLING.md, SECURITY.md 갱신 필수
