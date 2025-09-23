package com.example.backend.controller;

import static org.hamcrest.Matchers.*;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.backend.common.error.validation.ValidationErrorProcessor;
import com.example.backend.dto.user.Profile;
import com.example.backend.security.JwtUtil;
import com.example.backend.security.PIIMaskingUtils;
import com.example.backend.security.SecurityUtil;
import com.example.backend.service.ChatService;
import com.example.backend.service.UserService;

/**
 * 컨트롤러 슬라이스 테스트:
 * - 운영 보안 필터/설정 제외, 핵심 보안 필터는 활성(addFilters=true)
 * - 컨트롤러 생성자 의존만 MockitoBean으로 오버라이드
 */
@WebMvcTest(
	controllers = UserController.class,
	excludeFilters = {
		@Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {
			com.example.backend.security.JwtAuthenticationFilter.class,
			com.example.backend.security.SecurityConfig.class,
			com.example.backend.security.CustomUserDetailsService.class
		})
	}
)
@AutoConfigureMockMvc(addFilters = true) // 핵심 보안 필터 활성(WithMockUser 동작)
@Import({TestSecurityConfig.class})
@EnableMethodSecurity(prePostEnabled = true)
@TestPropertySource(properties = {
	"spring.mvc.problemdetails.enabled=false"  // 중요: 기본 ProblemDetail 비활성화
})
class UserControllerTest {

	@Autowired MockMvc mvc;

	// 컨트롤러 생성자 의존만 목 오버라이드
	@MockitoBean UserService userService;
	@MockitoBean ChatService chatService;
	@MockitoBean SecurityUtil securityUtil;
	@MockitoBean JwtUtil jwtUtil;

	// ValidationErrorProcessor 의존성 추가
	@MockitoBean PIIMaskingUtils piiMaskingUtils;
	@MockitoBean ValidationErrorProcessor validationErrorProcessor;

	// ---------- register ----------

	@Test
	@DisplayName("POST /api/users/register → 201 Created + Profile(JSON)")
	void register_created() throws Exception {
		Profile profile = Profile.builder()
			.userId(1L).email("kim@ex.com").nickname("KIM").build();
		given(userService.register(any())).willReturn(profile);

		mvc.perform(post("/api/users/register")
				.contentType(MediaType.APPLICATION_JSON)
				.accept(MediaType.APPLICATION_JSON)
				.content("""
                {
                  "email":"kim@ex.com",
                  "password":"Qwer1234!",
                  "confirmPassword":"Qwer1234!",
                  "nickname":"KIM",
                  "phoneNumber":"010-1234-5678",
                  "gender":"male",
                  "age":28,
                  "termsAccepted": true
                }
            """))
			.andExpect(status().isCreated())
			.andExpect(header().string("Location", "/api/users/" + profile.getNickname()))
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.email").value("kim@ex.com"))
			.andExpect(jsonPath("$.nickname").value("KIM"));
	}// [성공 케이스는 유효 페이로드 제공] [5][6]

	@Test
	@DisplayName("POST /api/users/register (유효성 실패) → 422 ProblemDetail")
	void register_validation_422() throws Exception {
		mvc.perform(post("/api/users/register")
				.contentType(MediaType.APPLICATION_JSON)
				.accept(MediaType.APPLICATION_JSON)
				.content("""
                    {
                      "email":"invalid",
                      "password":"short",
                      "confirmPassword":"mismatch",
                      "nickname":"",
                      "phoneNumber":"01012345678",
                      "gender":"male",
                      "age":28,
                      "termsAccepted": true
                    }
                """))
			.andExpect(status().isUnprocessableEntity())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.status").value(422))
			.andExpect(jsonPath("$.title").exists());
	} // [유효성 실패는 422로 분리 검증] [5][6]

	// ---------- availability ----------

	@Test
	@DisplayName("GET /api/users/availability?type=NICKNAME&value=KIM → 200 {isAvailable:true}")
	void availability_ok() throws Exception {
		given(userService.isNicknameAvailable("KIM")).willReturn(true);

		mvc.perform(get("/api/users/availability")
				.param("type","NICKNAME") // 슬라이스에서 컨버터 미주입 대비
				.param("value","KIM")
				.accept(MediaType.APPLICATION_JSON))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.isAvailable").value(true));
	} // [5]

	// ---------- getAccount (보호) ----------

	@Test
	@DisplayName("GET /api/users/account (미인증) → 401 ProblemDetail")
	void account_unauthorized() throws Exception {
		mvc.perform(get("/api/users/account").accept(MediaType.APPLICATION_JSON))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.status").value(401))
			.andExpect(jsonPath("$.instance").value("/api/users/account"));
	} // [4]

	@Test
	@DisplayName("GET /api/users/account (인증) → 200 Profile + no-store")
	void account_ok() throws Exception {
		given(securityUtil.requirePrincipalEmail(any())).willReturn("me@ex.com");
		Profile profile = Profile.builder()
			.userId(10L).email("me@ex.com").nickname("ME").build();
		given(userService.getUserByEmail("me@ex.com")).willReturn(Optional.of(profile));

		mvc.perform(get("/api/users/account")
				.with(user("me@ex.com"))
				.accept(MediaType.APPLICATION_JSON))
			.andExpect(status().isOk())
			.andExpect(header().string("Cache-Control", "no-store"))
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.email").value("me@ex.com"))
			.andExpect(jsonPath("$.nickname").value("ME"));
	} // [보안 필터 활성 + WithMockUser] [4][2]

	// ---------- updateAccount (보호) ----------

	@Test
	@DisplayName("PATCH /api/users/account (인증) → 204 No Content")
	void update_account_noContent() throws Exception {
		given(securityUtil.requirePrincipalEmail(any())).willReturn("me@ex.com");

		mvc.perform(patch("/api/users/account")
				.with(user("me@ex.com"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
                {
                  "nickname":"NEWME",
                  "fullName":"김테스트",
                  "age":28,
                  "gender":"male",
                  "phoneNumber":"010-1111-2222",
                  "mentalState":"우울증",
                  "chatGoal":"상담받기"
                }
                """)) // ✅ 모든 필수 필드 포함
			.andExpect(status().isNoContent());

		then(userService).should().updateUser(eq("me@ex.com"), any());
	}

	// ---------- deleteAccount (보호) ----------

	@Test
	@DisplayName("DELETE /api/users/account (인증) → 204 + 쿠키 삭제 호출")
	void delete_account_noContent() throws Exception {
		given(securityUtil.requirePrincipalEmail(any())).willReturn("me@ex.com");

		mvc.perform(delete("/api/users/account")
				.with(user("me@ex.com"))
				.accept(MediaType.APPLICATION_JSON))
			.andExpect(status().isNoContent());

		then(userService).should().deleteUser("me@ex.com");
		then(jwtUtil).should().clearJwtCookie(any());
	} // [4]

	// ---------- changePassword (보호) ----------

	@Test
	@DisplayName("PATCH /api/users/account/password (인증, 유효) → 204 + no-store + 쿠키 삭제")
	void change_password_noContent() throws Exception {
		given(securityUtil.requirePrincipalEmail(any())).willReturn("me@ex.com");

		mvc.perform(patch("/api/users/account/password")
				.with(user("me@ex.com"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
                {"currentPassword":"OldPw!1aB","password":"NewPw12!Abc","confirmPassword":"NewPw12!Abc"}
            """))
			.andExpect(status().isNoContent())
			.andExpect(header().string("Cache-Control", "no-store"));

		then(userService).should().changePasswordWithCurrentCheck(eq("me@ex.com"),
			anyString(), anyString(), anyString());
		then(jwtUtil).should().clearJwtCookie(any());
	} // [유효 페이로드 사용] [5]

	@Test
	@DisplayName("PATCH /api/users/account/password (유효성 실패) → 422 ProblemDetail")
	void change_password_422() throws Exception {
		mvc.perform(patch("/api/users/account/password")
				.with(user("me@ex.com"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
                    {"currentPassword":"x","password":"y","confirmPassword":"z"}
                """))
			.andExpect(status().isUnprocessableEntity())
			.andExpect(header().string("Content-Type", startsWith("application/problem+json")))
			.andExpect(jsonPath("$.status").value(422));
	} // [5][6]

	// 1) register: 형식 오류 400 (malformed JSON)
	@Test
	@DisplayName("POST /api/users/register (Malformed JSON) → 400 Bad Request")
	void register_malformedJson_400() throws Exception {
		mvc.perform(post("/api/users/register")
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"age\":\"xx\"}")
		).andExpect(status().isBadRequest());
	} // 역직렬화 실패는 400 경로가 맞다 [7]

	// 2) register: Content-Type 미지정 → 415 (선호 시, produces 설정 없으면 400일 수도)
	@Test
	@DisplayName("POST /api/users/register (Unsupported Media Type) → 415")
	void register_unsupportedMediaType_415() throws Exception {
		mvc.perform(post("/api/users/register")
				.content("email=kim@ex.com&password=x")) // no contentType
			.andExpect(status().isUnsupportedMediaType());
	} // 미지정/비호환 미디어타입 검증 예시 [7]

	// 3) register: 이메일 중복 409
	@Test
	@DisplayName("POST /api/users/register (이메일 중복) → 409 Conflict")
	void register_conflict_email_409() throws Exception {
		willThrow(new com.example.backend.common.error.ConflictException(
			"이미 사용중인 이메일입니다.", "DUPLICATE_EMAIL", "email"))
			.given(userService).register(any());

		mvc.perform(post("/api/users/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
      {"email":"dup@ex.com","password":"Qwer1234!","confirmPassword":"Qwer1234!","nickname":"KIM","gender":"male","age":28,"termsAccepted":true,"phoneNumber":"010-1111-2222"}
      """))
			.andExpect(status().isConflict())
			.andExpect(header().string("Content-Type", startsWith("application/problem+json")));
	} // 도메인 충돌을 409로 분리 [7]

	// 4) register: 닉네임 중복 409
	@Test
	@DisplayName("POST /api/users/register (닉네임 중복) → 409 Conflict")
	void register_conflict_nickname_409() throws Exception {
		willThrow(new com.example.backend.common.error.ConflictException(
			"이미 사용중인 닉네임입니다.", "DUPLICATE_NICKNAME", "nickname"))
			.given(userService).register(any());

		mvc.perform(post("/api/users/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
      {"email":"new@ex.com","password":"Qwer1234!","confirmPassword":"Qwer1234!","nickname":"DUP","gender":"male","age":28,"termsAccepted":true,"phoneNumber":"010-1111-2222"}
      """))
			.andExpect(status().isConflict());
	} // [7]

	// 5) availability: 잘못된 enum → 400
	@Test
	@DisplayName("GET /api/users/availability (잘못된 type) → 400 Bad Request")
	void availability_invalidEnum_400() throws Exception {
		mvc.perform(get("/api/users/availability")
				.param("type","WRONG") // enum 변환 실패
				.param("value","KIM"))
			.andExpect(status().isBadRequest());
	} // 파라미터 타입 변환 실패 검증 [7]

	// 6) availability: 필수 파라미터 누락 → 400
	@Test
	@DisplayName("GET /api/users/availability (value 누락) → 400 Bad Request")
	void availability_missingParam_400() throws Exception {
		mvc.perform(get("/api/users/availability")
				.param("type","NICKNAME"))
			.andExpect(status().isBadRequest());
	} // 필수 파라미터 누락 시 400 [7]

	// 7) account: 인증 필수 → 401 (이미 존재)
	@Test
	@DisplayName("GET /api/users/account (인증 없음) → 401")
	void account_unauth_401_again() throws Exception {
		mvc.perform(get("/api/users/account"))
			.andExpect(status().isUnauthorized());
	} // 보안 흐름 확인 추가 [21]

	// 8) updateAccount: 미인증 → 401
	@Test
	@DisplayName("PATCH /api/users/account (미인증) → 401")
	void update_account_unauth_401() throws Exception {
		mvc.perform(patch("/api/users/account")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
					{"nickname":"NEW"}"""))
			.andExpect(status().isUnauthorized());
	} // 인증 요구 경로 검증 [21]

	// 9) updateAccount: DTO 검증 실패 → 422
	@Test
	@DisplayName("PATCH /api/users/account (검증 실패) → 422")
	void update_account_422() throws Exception {
		given(securityUtil.requirePrincipalEmail(any())).willReturn("me@ex.com");
		mvc.perform(patch("/api/users/account")
				.with(user("me@ex.com"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
                {"nickname":""}
                """)) // ✅ 부분 필드만 전송 → 422 발생
			.andExpect(status().isUnprocessableEntity())
			.andExpect(header().string("Content-Type", startsWith("application/problem+json")))
			.andExpect(jsonPath("$.status").value(422))
			.andExpect(jsonPath("$.errors").exists())
			.andExpect(jsonPath("$.errors.nickname").exists()) // 빈 닉네임 에러
			.andExpect(jsonPath("$.errors.age").exists())      // 누락된 나이 에러
			.andExpect(jsonPath("$.errors.fullName").exists()) // 누락된 성명 에러
			.andExpect(jsonPath("$.errors.gender").exists())   // 누락된 성별 에러
			.andExpect(jsonPath("$.errors.mentalState").exists()); // 누락된 현재상태 에러
	}

	@Test
	@DisplayName("PATCH /api/users/account (일부 필드만 전송) → 422 Validation")
	void update_account_partial_422() throws Exception {
		given(securityUtil.requirePrincipalEmail(any())).willReturn("me@ex.com");
		mvc.perform(patch("/api/users/account")
				.with(user("me@ex.com"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
                {"nickname":"NEWME","phoneNumber":"010-1111-2222"}
                """)) // ✅ 일부 필드만 → 나머지 필드 누락 에러
			.andExpect(status().isUnprocessableEntity())
			.andExpect(header().string("Content-Type", startsWith("application/problem+json")))
			.andExpect(jsonPath("$.status").value(422))
			.andExpect(jsonPath("$.errors.mentalState").exists())
			.andExpect(jsonPath("$.errors.gender").exists())
			.andExpect(jsonPath("$.errors.fullName").exists())
			.andExpect(jsonPath("$.errors.age").exists());
	}

	// 10) deleteAccount: 미인증 → 401
	@Test
	@DisplayName("DELETE /api/users/account (미인증) → 401")
	void delete_account_unauth_401() throws Exception {
		mvc.perform(delete("/api/users/account"))
			.andExpect(status().isUnauthorized());
	} // [21]

	// 11) changePassword: 미인증 → 401
	@Test
	@DisplayName("PATCH /api/users/account/password (미인증) → 401")
	void change_password_unauth_401() throws Exception {
		mvc.perform(patch("/api/users/account/password")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
                  {"currentPassword":"x","password":"y","confirmPassword":"y"}"""))
			.andExpect(status().isUnauthorized());
	} // [21]

	// 12) changePassword: 형식 오류 400
	@Test
	@DisplayName("PATCH /api/users/account/password (Malformed JSON) → 400")
	void change_password_malformed_400() throws Exception {
		mvc.perform(patch("/api/users/account/password")
				.with(user("me@ex.com"))
				.contentType(MediaType.APPLICATION_JSON)
				.content(String.format("{\"currentPassword\":\"x\",\"password\":\"y\""))) // 닫힘 누락
			.andExpect(status().isBadRequest());
	} // 역직렬화 실패 400 [7]
}
