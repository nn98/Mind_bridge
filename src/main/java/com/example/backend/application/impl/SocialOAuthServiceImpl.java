package com.example.backend.application.impl;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.example.backend.application.service.SocialOAuthService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * SocialOAuthServiceImpl (통합)
 * - provider: "google" | "kakao"
 * - 인가 URL / 토큰 교환 / 사용자 조회 / 표준화 추출을 단일 클래스에서 분기 처리
 * - 기존 GoogleSocialAuthController + KakaoOAuthServiceImpl 기능 흡수
 *
 * 주의:
 * - 운영 배포 시 각 콘솔의 redirect_uri가 정확히 일치해야 하며,
 *   HTTPS 환경에서만 Secure Cookie가 동작합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SocialOAuthServiceImpl implements SocialOAuthService {

	private final RestTemplate restTemplate;

	// ===== Google props =====
	@Value("${google.rest.api.key}")
	private String googleClientId;

	@Value("${google.redirect.uri}")
	private String googleRedirectUri;

	@Value("${google.rest.api.secret}")
	private String googleClientSecret;

	// ===== Kakao props =====
	@Value("${kakao.rest.api.key}")
	private String kakaoClientId;

	@Value("${kakao.client-secret:}")
	private String kakaoClientSecret;

	@Value("${kakao.redirect.uri}")
	private String kakaoRedirectUri;

	// ===== Google endpoints =====
	private static final String GOOGLE_AUTH_URL   = "https://accounts.google.com/o/oauth2/v2/auth";
	private static final String GOOGLE_TOKEN_URL  = "https://oauth2.googleapis.com/token";
	private static final String GOOGLE_USERINFO   = "https://www.googleapis.com/oauth2/v2/userinfo";

	// ===== Kakao endpoints =====
	private static final String KAKAO_AUTH_URL    = "https://kauth.kakao.com/oauth/authorize";
	private static final String KAKAO_TOKEN_URL   = "https://kauth.kakao.com/oauth/token";
	private static final String KAKAO_USER_INFO   = "https://kapi.kakao.com/v2/user/me";

	// =========================
	// 인가 URL
	// =========================
	@Override
	public String buildAuthorizationUrl(String provider) {
		return switch (provider.toLowerCase()) {
			case "google" -> buildGoogleAuthorizeUrl();
			case "kakao"  -> buildKakaoAuthorizeUrl();
			default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
		};
	}

	private String buildGoogleAuthorizeUrl() {
		// 안전 인코딩 권장
		return UriComponentsBuilder.fromHttpUrl(GOOGLE_AUTH_URL)
			.queryParam("client_id", googleClientId)
			.queryParam("redirect_uri", googleRedirectUri)
			.queryParam("response_type", "code")
			.queryParam("scope", "email profile openid")
			.queryParam("access_type", "offline")
			.queryParam("prompt", "consent")
			.queryParam("state", "google")
			.build()
			.toUriString();
	}

	private String buildKakaoAuthorizeUrl() {
		return UriComponentsBuilder.fromHttpUrl(KAKAO_AUTH_URL)
			.queryParam("client_id", kakaoClientId)
			.queryParam("redirect_uri", kakaoRedirectUri)
			.queryParam("response_type", "code")
			.queryParam("scope", "profile_nickname,account_email")
			.build()
			.toUriString();
	}

	// =========================
	// code → access_token
	// =========================
	@Override
	public String exchangeCodeForAccessToken(String provider, String code) {
		return switch (provider.toLowerCase()) {
			case "google" -> exchangeGoogleToken(code);
			case "kakao"  -> exchangeKakaoToken(code);
			default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
		};
	}

	private String exchangeGoogleToken(String code) {
		MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
		params.add("code", code);
		params.add("client_id", googleClientId);
		params.add("client_secret", googleClientSecret);
		params.add("redirect_uri", googleRedirectUri);
		params.add("grant_type", "authorization_code");

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
		HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);

		ResponseEntity<Map> res = restTemplate.postForEntity(GOOGLE_TOKEN_URL, entity, Map.class);
		if (!res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
			throw new RuntimeException("Google token exchange failed: " + res.getStatusCode());
		}
		String token = (String) res.getBody().get("access_token");
		if (token == null || token.isEmpty()) {
			throw new RuntimeException("Google access_token is missing");
		}
		return token;
	}

	private String exchangeKakaoToken(String code) {
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

		MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
		params.add("grant_type", "authorization_code");
		params.add("client_id", kakaoClientId);
		params.add("redirect_uri", kakaoRedirectUri);
		params.add("code", code);
		if (kakaoClientSecret != null && !kakaoClientSecret.trim().isEmpty()) {
			params.add("client_secret", kakaoClientSecret);
		}

		HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
		ResponseEntity<Map> response = restTemplate.exchange(KAKAO_TOKEN_URL, HttpMethod.POST, request, Map.class);
		if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
			throw new RuntimeException("Kakao token exchange failed: " + response.getStatusCode());
		}
		Object at = response.getBody().get("access_token");
		if (at == null) {
			throw new RuntimeException("Kakao response missing access_token");
		}
		return (String) at;
	}

	// =========================
	// 사용자 정보 조회 (raw)
	// =========================
	@Override
	@SuppressWarnings("unchecked")
	public Map<String, Object> fetchRawUserInfo(String provider, String accessToken) {
		return switch (provider.toLowerCase()) {
			case "google" -> {
				HttpHeaders headers = new HttpHeaders();
				headers.setBearerAuth(accessToken);
				headers.setContentType(MediaType.APPLICATION_JSON);
				HttpEntity<String> entity = new HttpEntity<>(headers);
				ResponseEntity<Map> resp = restTemplate.exchange(GOOGLE_USERINFO, HttpMethod.GET, entity, Map.class);
				if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
					throw new RuntimeException("Google userinfo failed: " + resp.getStatusCode());
				}
				yield resp.getBody();
			}
			case "kakao" -> {
				HttpHeaders headers = new HttpHeaders();
				headers.setBearerAuth(accessToken);
				headers.setContentType(MediaType.APPLICATION_JSON);
				HttpEntity<String> request = new HttpEntity<>(headers);
				ResponseEntity<Map> response = restTemplate.exchange(KAKAO_USER_INFO, HttpMethod.GET, request, Map.class);
				if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
					throw new RuntimeException("Kakao userinfo failed: " + response.getStatusCode());
				}
				yield response.getBody();
			}
			default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
		};
	}

	// =========================
	// 표준 사용자 추출(email, nickname)
	// =========================
	@Override
	@SuppressWarnings("unchecked")
	public StandardUser extractStandardUser(String provider, Map<String, Object> raw) {
		return switch (provider.toLowerCase()) {
			case "google" -> {
				String email = (String) raw.get("email");
				String nickname = (String) raw.get("name");
				ensureEmail(provider, email);
				yield new SocialOAuthService.StandardUser(email, nickname);
			}
			case "kakao" -> {
				Map<String, Object> kakaoAccount = (Map<String, Object>) raw.get("kakao_account");
				if (kakaoAccount == null || kakaoAccount.get("email") == null) {
					throw new RuntimeException("Kakao account missing email (consent needed)");
				}
				String email = (String) kakaoAccount.get("email");
				String nickname = "카카오사용자";
				Map<String, Object> props = (Map<String, Object>) raw.get("properties");
				if (props != null && props.get("nickname") != null) {
					nickname = String.valueOf(props.get("nickname"));
				}
				if (nickname == null || nickname.trim().isEmpty()) {
					nickname = "카카오사용자_" + System.currentTimeMillis();
				}
				ensureEmail(provider, email);
				yield new StandardUser(email, nickname);
			}
			default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
		};
	}

	private void ensureEmail(String provider, String email) {
		if (email == null || email.trim().isEmpty()) {
			throw new RuntimeException("[" + provider + "] email is missing");
		}
	}
}
