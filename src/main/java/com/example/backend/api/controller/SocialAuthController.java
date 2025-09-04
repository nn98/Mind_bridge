package com.example.backend.api.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.infrastructure.persistence.entity.UserEntity;
import com.example.backend.infrastructure.security.JwtUtil;
import com.example.backend.application.service.SocialOAuthService;
import com.example.backend.application.service.SocialOAuthService.StandardUser;
import com.example.backend.application.service.UserService;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * SocialAuthController (refactored)
 * - provider(google|kakao)에 따라 통합 서비스로 OAuth 흐름을 처리
 * - 콜백은 302 리다이렉트 통일, 쿠키는 SameSite=None; Secure=true
 * - 성공: http://localhost:3000/auth/success?provider={provider}
 * - 실패: http://localhost:3000/auth/error?provider={provider}
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/social")
@RequiredArgsConstructor
public class SocialAuthController {

	private final SocialOAuthService socialOAuthService;
	private final UserService userService;
	private final JwtUtil jwtUtil;

	// 프론트 리다이렉트 베이스 URL (환경변수로 대체 가능)
	@Value("${app.front.success-url:http://localhost:3000/auth/success?provider=}")
	private String successRedirectBase;

	@Value("${app.front.error-url:http://localhost:3000/auth/error?provider=}")
	private String errorRedirectBase;

	// ============== 로그인 시작(인가 URL) ==============

	/**
	 * 로그인 시작: provider 인가 URL로 302 리다이렉트
	 * 예) /api/auth/social/google/login, /api/auth/social/kakao/login
	 */
	@GetMapping("/{provider}/login")
	public ResponseEntity<Void> login(@PathVariable String provider) {
		String authorizeUrl = socialOAuthService.buildAuthorizationUrl(provider);
		log.info("[SocialLogin][{}] authorize redirect: {}", provider, authorizeUrl);
		return ResponseEntity.status(HttpStatus.FOUND)
			.header(HttpHeaders.LOCATION, authorizeUrl)
			.build();
	}

	// ============== 콜백 처리 ==============

	/**
	 * 콜백: code → token → raw user → 표준화 추출 → findOrCreate → JWT 쿠키 → 302 성공 리다이렉트
	 * 예) /api/auth/social/google/callback?code=..., /api/auth/social/kakao/callback?code=...
	 */
	@GetMapping("/{provider}/callback")
	public ResponseEntity<Void> callback(@PathVariable String provider,
		@RequestParam("code") String code,
		HttpServletResponse rawResponse) {
		try {
			log.info("[SocialLogin][{}] callback start - code: {}", provider, code);

			// 1) code → access_token
			String accessToken = socialOAuthService.exchangeCodeForAccessToken(provider, code);

			// 2) raw user info
			Map<String, Object> raw = socialOAuthService.fetchRawUserInfo(provider, accessToken);

			// 3) 표준 사용자 정보(email, nickname)
			StandardUser std = socialOAuthService.extractStandardUser(provider, raw);
			String email = std.email();
			String nickname = std.nickname();

			// 4) 사용자 찾기/생성(정책 수렴)
			UserEntity user = userService.findOrCreateSocialUser(email, nickname, provider);

			// 5) JWT 발급 및 쿠키 설정
			String jwt = jwtUtil.generateToken(email);
			ResponseCookie cookie = buildJwtCookie(jwt);

			// 6) 성공 302 리다이렉트
			String redirect = successRedirectBase + provider;
			log.info("[SocialLogin][{}] success - email: {}, redirect: {}", provider, email, redirect);
			return ResponseEntity.status(HttpStatus.FOUND)
				.header(HttpHeaders.SET_COOKIE, cookie.toString())
				.header(HttpHeaders.LOCATION, redirect)
				.build();

		} catch (Exception e) {
			log.error("[SocialLogin][{}] failed: {}", provider, e.getMessage(), e);
			// 에러도 302 리다이렉트로 통일(민감정보 노출 금지)
			String redirect = errorRedirectBase + provider;
			return ResponseEntity.status(HttpStatus.FOUND)
				.header(HttpHeaders.LOCATION, redirect)
				.build();
		}
	}

	// ============== 내부 유틸 ==============

	/**
	 * 공통 JWT 쿠키 빌더
	 * - 운영 기준 선적용: SameSite=None; Secure=true (HTTPS 필요)
	 */
	private ResponseCookie buildJwtCookie(String token) {
		return ResponseCookie.from("jwt", token)
			.httpOnly(true)
			.secure(true)       // HTTPS 필수
			.sameSite("None")   // 크로스 도메인 쿠키 허용
			.path("/")
			.maxAge(24 * 60 * 60)
			.build();
	}
}
