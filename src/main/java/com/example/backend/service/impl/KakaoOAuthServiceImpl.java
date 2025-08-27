// service/impl/KakaoOAuthServiceImpl.java
package com.example.backend.service.impl;

import java.util.HashMap;
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

import com.example.backend.service.KakaoOAuthService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoOAuthServiceImpl implements KakaoOAuthService {

	private final RestTemplate restTemplate;

	@Value("${kakao.rest.api.key}")
	private String kakaoClientId;

	@Value("${kakao.client-secret:}")
	private String kakaoClientSecret;

	@Value("${kakao.redirect.uri}")
	private String kakaoRedirectUri;

	private static final String KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
	private static final String KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";
	private static final String KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";

	@Override
	public String getAuthorizationUrl() {
		StringBuilder urlBuilder = new StringBuilder(KAKAO_AUTH_URL);
		urlBuilder.append("?client_id=").append(kakaoClientId);
		urlBuilder.append("&redirect_uri=").append(kakaoRedirectUri);
		urlBuilder.append("&response_type=code");
		urlBuilder.append("&scope=profile_nickname,account_email");
		String authUrl = urlBuilder.toString();
		log.info("[KakaoOAuth] 인증 URL 생성: {}", authUrl);
		return authUrl;
	}

	@Override
	public String requestAccessToken(String code) {
		log.info("[KakaoOAuth] 액세스 토큰 요청 시작 - code: {}", code);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
		MultiValueMap<String, String> params = buildTokenRequestParams(code);
		HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

		try {
			log.info("[KakaoOAuth] 토큰 요청 URL: {}", KAKAO_TOKEN_URL);
			log.info("[KakaoOAuth] 토큰 요청 파라미터: {}", params);
			@SuppressWarnings("unchecked")
			ResponseEntity<Map> response = restTemplate.exchange(KAKAO_TOKEN_URL, HttpMethod.POST, request, Map.class);
			log.info("[KakaoOAuth] 토큰 응답 상태: {}", response.getStatusCode());
			if (!response.getStatusCode().is2xxSuccessful()) {
				throw new RuntimeException("카카오 토큰 발급 실패 - HTTP " + response.getStatusCode());
			}
			Map<String, Object> body = response.getBody();
			if (body == null || !body.containsKey("access_token")) {
				throw new RuntimeException("토큰 응답에서 access_token이 누락되었습니다.");
			}
			String accessToken = (String) body.get("access_token");
			log.info("[KakaoOAuth] 액세스 토큰 발급 성공");
			return accessToken;
		} catch (Exception e) {
			log.error("[KakaoOAuth] 액세스 토큰 요청 실패: {}", e.getMessage());
			throw new RuntimeException("카카오 액세스 토큰 요청 실패", e);
		}
	}

	@Override
	@SuppressWarnings("unchecked")
	public Map<String, Object> requestUserInfo(String accessToken) {
		log.info("[KakaoOAuth] 사용자 정보 요청 시작");
		HttpHeaders headers = new HttpHeaders();
		headers.setBearerAuth(accessToken);
		headers.setContentType(MediaType.APPLICATION_JSON);
		HttpEntity<String> request = new HttpEntity<>(headers);
		try {
			ResponseEntity<Map> response = restTemplate.exchange(KAKAO_USER_INFO_URL, HttpMethod.GET, request, Map.class);
			log.info("[KakaoOAuth] 사용자 정보 응답 상태: {}", response.getStatusCode());
			if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
				throw new RuntimeException("카카오 사용자 정보 조회 실패 - HTTP " + response.getStatusCode());
			}
			Map<String, Object> userInfo = response.getBody();
			log.info("[KakaoOAuth] 사용자 정보 조회 성공 - ID: {}", userInfo.get("id"));
			return userInfo;
		} catch (Exception e) {
			log.error("[KakaoOAuth] 사용자 정보 조회 실패: {}", e.getMessage());
			throw new RuntimeException("카카오 사용자 정보 조회 실패", e);
		}
	}

	@Override
	@SuppressWarnings("unchecked")
	public Map<String, Object> extractJwtPayload(Map<String, Object> userInfo) {
		Map<String, Object> payload = new HashMap<>();
		try {
			if (userInfo.get("id") != null) {
				payload.put("kakaoId", userInfo.get("id"));
			}
			Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
			if (kakaoAccount != null) {
				Object email = kakaoAccount.get("email");
				if (email != null) payload.put("email", email);
			}
			Map<String, Object> properties = (Map<String, Object>) userInfo.get("properties");
			if (properties != null) {
				Object nickname = properties.get("nickname");
				if (nickname != null) payload.put("nickname", nickname);
				Object profileImage = properties.get("profile_image");
				if (profileImage != null) payload.put("profileImage", profileImage);
			}
			log.info("[KakaoOAuth] JWT 페이로드 추출 완료 - email: {}, nickname: {}", payload.get("email"), payload.get("nickname"));
			return payload;
		} catch (Exception e) {
			log.error("[KakaoOAuth] JWT 페이로드 추출 실패: {}", e.getMessage());
			throw new RuntimeException("카카오 사용자 정보 파싱 실패", e);
		}
	}

	@Override
	@SuppressWarnings("unchecked")
	public Map<String, String> validateAndExtractUserInfo(Map<String, Object> userInfo) {
		Map<String, String> validatedInfo = new HashMap<>();
		Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
		if (kakaoAccount == null || kakaoAccount.get("email") == null) {
			throw new RuntimeException("카카오 계정에 이메일 정보가 없습니다. 카카오 설정에서 이메일 제공에 동의해주세요.");
		}
		String email = (String) kakaoAccount.get("email");
		if (email.trim().isEmpty()) {
			throw new RuntimeException("유효하지 않은 이메일 형식입니다.");
		}
		validatedInfo.put("email", email);

		Map<String, Object> properties = (Map<String, Object>) userInfo.get("properties");
		String nickname = "카카오사용자";
		if (properties != null && properties.get("nickname") != null) {
			nickname = (String) properties.get("nickname");
		}
		if (nickname == null || nickname.trim().isEmpty()) {
			nickname = "카카오사용자_" + System.currentTimeMillis();
		}
		validatedInfo.put("nickname", nickname);
		log.info("[KakaoOAuth] 사용자 정보 검증 완료 - email: {}, nickname: {}", email, nickname);
		return validatedInfo;
	}

	private MultiValueMap<String, String> buildTokenRequestParams(String code) {
		MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
		params.add("grant_type", "authorization_code");
		params.add("client_id", kakaoClientId);
		params.add("redirect_uri", kakaoRedirectUri);
		params.add("code", code);
		if (kakaoClientSecret != null && !kakaoClientSecret.trim().isEmpty()) {
			params.add("client_secret", kakaoClientSecret);
		}
		return params;
	}
}
