package com.example.backend.infrastructure.config.properties;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

/**
 * 읽기 쉬운 Key로 평면 Map을 제공(선택)
 * - 운영/디버깅 시 빠르게 값 확인
 */
@Component
public class SocialOAuthView {

	private final SocialOAuthProperties p;
	public SocialOAuthView(SocialOAuthProperties p) { this.p = p; }

	public Map<String, String> asFlatMap() {
		Map<String, String> m = new LinkedHashMap<>();
		m.put("kakao_client_id", p.getKakao().getRestApiKey());
		m.put("kakao_redirect_uri", p.getKakao().getRedirectUri());
		m.put("kakao_redirect_uri-i", p.getKakao().getRedirectUriIntegration());
		m.put("google_client_id", p.getGoogle().getRestApiKey());
		m.put("google_redirect_uri", p.getGoogle().getRedirectUri());
		m.put("google_redirect_uri-i", p.getGoogle().getRedirectUriIntegration());
		m.put("google_client-secret", p.getGoogle().getRestApiSecret());

		m.put("kakao_auth_url", "https://kauth.kakao.com/oauth/authorize");
		m.put("kakao_token_url", "https://kapi.kakao.com/v2/user/me");
		m.put("kakao_user_info_url", "https://kauth.kakao.com/oauth/token");
		m.put("google_auth_url", "https://accounts.google.com/o/oauth2/v2/auth?");
		m.put("google_token_url", "https://oauth2.googleapis.com/token");
		m.put("google_user_info_url", "https://www.googleapis.com/oauth2/v2/userinfo");
		return Map.copyOf(m);
	}
}
