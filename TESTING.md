# 테스트 전략

## 범주
- 단위 테스트: 서비스 규칙/변환/유틸
- 웹 슬라이스 테스트: @WebMvcTest + MockMvc로 컨트롤러, JSON 계약, 전역 예외 검증
- 통합 테스트: @SpringBootTest + @AutoConfigureMockMvc(addFilters=true)로 Security/JWT/JsonAuthHandlers 포함

## 우선 시나리오
- 회원가입: 201 Created + Location, 중복 409, DTO 검증 422
- 로그인/로그아웃: 200 + 쿠키 Set/Clear, 잘못된 자격 401
- 계정: 401(미인증), 404(없음), 200(정상)
- 비밀번호 변경: 현재 불일치/확인 불일치 400, 성공 204
- 게시글: 생성 201/수정·삭제 권한 403/존재 404
- 채팅: 세션 생성/메시지 처리 200, 외부 실패 시 에러 전파

## 샘플(MockMvc) 스니펫
```java
@WebMvcTest(UserController.class)
@Import({ProblemDetailsAdvice.class, SecurityUtil.class})
class UserControllerSliceTest {

	@Autowired MockMvc mvc;
	@MockBean UserService userService;
	@MockBean JwtUtil jwtUtil; // 컨트롤러 직접 의존만 목킹
	@MockBean PasswordEncoder encoder;

	@Test
	void register_created_201() throws Exception {
		var req = """
			{"age":25,"email":"a@b.com","password":"P@ssw0rd!","nickname":"nick","gender":"M","phoneNumber":"010-1234-5678","termsAccepted":true}
			""";
		var profile = new Profile(); profile.setNickname("nick");
		when(userService.register(any())).thenReturn(profile);
		mvc.perform(post("/api/users/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content(req))
			.andExpect(status().isCreated())
			.andExpect(header().string("Location","/api/users/nick"));
	}
	@Test
	void availability_bad_type_400() throws Exception {
		mvc.perform(get("/api/users/availability")
				.param("type","WRONG").param("value","x"))
			.andExpect(status().isBadRequest())
			.andExpect(content().contentTypeCompatibleWith("application/problem+json"));
	}
}

```
## 통합 샘플(401 ProblemDetail)
```java
@SpringBootTest
@AutoConfigureMockMvc(addFilters = true)
class SecurityIntegrationTest {
	@Autowired MockMvc mvc;

	@Test
	void account_requires_auth_401_problemdetail() throws Exception {
		mvc.perform(get("/api/users/account"))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith("application/problem+json"))
			.andExpect(jsonPath("$.title").value("Unauthorized"));
	}
}

```