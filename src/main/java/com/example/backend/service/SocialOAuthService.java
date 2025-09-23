package com.example.backend.service;

import java.util.Map;

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

import com.example.backend.config.properties.OAuthProperties;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SocialOAuthService {

	private final RestTemplate restTemplate;
	private final OAuthProperties oAuthProps; // 변경: 통합 프로퍼티
	public record StandardUser(String email, String nickname) {}

	// ===== Google endpoints =====
	private static final String GOOGLE_AUTH_URL   = "https://accounts.google.com/o/oauth2/v2/auth";
	private static final String GOOGLE_TOKEN_URL  = "https://oauth2.googleapis.com/token";
	private static final String GOOGLE_USERINFO   = "https://www.googleapis.com/oauth2/v2/userinfo";

	// ===== Kakao endpoints =====
	private static final String KAKAO_AUTH_URL    = "https://kauth.kakao.com/oauth/authorize";
	private static final String KAKAO_TOKEN_URL   = "https://kauth.kakao.com/oauth/token";
	private static final String KAKAO_USER_INFO   = "https://kapi.kakao.com/v2/user/me";

	public String buildAuthorizationUrl(String provider) {
		return switch (provider.toLowerCase()) {
			case "google" -> buildGoogleAuthorizeUrl();
			case "kakao"  -> buildKakaoAuthorizeUrl();
			default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
		};
	}

	private String buildGoogleAuthorizeUrl() {
		var g = oAuthProps.getGoogle();
		return UriComponentsBuilder.fromHttpUrl(GOOGLE_AUTH_URL)
			.queryParam("client_id", g.getClientId())
			.queryParam("redirect_uri", g.getRedirectUri())
			.queryParam("response_type", "code")
			.queryParam("scope", "email profile openid")
			.queryParam("access_type", "offline")
			.queryParam("prompt", "consent")
			.queryParam("state", "google")
			.build()
			.toUriString();
	}

	private String buildKakaoAuthorizeUrl() {
		var k = oAuthProps.getKakao();
		return UriComponentsBuilder.fromHttpUrl(KAKAO_AUTH_URL)
			.queryParam("client_id", k.getClientId())
			.queryParam("redirect_uri", k.getRedirectUri())
			.queryParam("response_type", "code")
			.queryParam("scope", "profile_nickname,account_email")
			.build()
			.toUriString();
	}

	public String exchangeCodeForAccessToken(String provider, String code) {
		return switch (provider.toLowerCase()) {
			case "google" -> exchangeGoogleToken(code);
			case "kakao"  -> exchangeKakaoToken(code);
			default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
		};
	}

	private String exchangeGoogleToken(String code) {
		var g = oAuthProps.getGoogle();

		MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
		params.add("code", code);
		params.add("client_id", g.getClientId());
		params.add("client_secret", g.getClientSecret());
		params.add("redirect_uri", g.getRedirectUri());
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
		var k = oAuthProps.getKakao();

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

		MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
		params.add("grant_type", "authorization_code");
		params.add("client_id", k.getClientId());
		params.add("redirect_uri", k.getRedirectUri());
		params.add("code", code);
		if (k.getClientSecret() != null && !k.getClientSecret().isBlank()) {
			params.add("client_secret", k.getClientSecret());
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
