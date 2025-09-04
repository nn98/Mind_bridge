package com.example.backend.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Social OAuth 외부 설정 바인딩
 * - application.properties/yml의 키를 타입 세이프로 바인딩
 * - Maven/Gradle 무관하게 동일 사용
 */
@Component
@ConfigurationProperties(prefix = "")
public class SocialOAuthProperties {


	private Kakao kakao = new Kakao();
	private Google google = new Google();

	public Kakao getKakao() { return kakao; }
	public Google getGoogle() { return google; }

	public static class Kakao {
		// kakao.rest.api.key=...
		private String restApiKey;
		// kakao.redirect.uri=...
		private String redirectUri;
		// kakao.redirect.uri.integration=...
		private String redirectUriIntegration;

		public String getRestApiKey() { return restApiKey; }
		public void setRestApiKey(String v) { this.restApiKey = v; }
		public String getRedirectUri() { return redirectUri; }
		public void setRedirectUri(String v) { this.redirectUri = v; }
		public String getRedirectUriIntegration() { return redirectUriIntegration; }
		public void setRedirectUriIntegration(String v) { this.redirectUriIntegration = v; }
	}

	public static class Google {
		// google.rest.api.key=...
		private String restApiKey;
		// google.redirect.uri=...
		private String redirectUri;
		// google.redirect.uri.integration=...
		private String redirectUriIntegration;
		// google.rest.api.secret=...
		private String restApiSecret;

		public String getRestApiKey() { return restApiKey; }
		public void setRestApiKey(String v) { this.restApiKey = v; }
		public String getRedirectUri() { return redirectUri; }
		public void setRedirectUri(String v) { this.redirectUri = v; }
		public String getRedirectUriIntegration() { return redirectUriIntegration; }
		public void setRedirectUriIntegration(String v) { this.redirectUriIntegration = v; }
		public String getRestApiSecret() { return restApiSecret; }
		public void setRestApiSecret(String v) { this.restApiSecret = v; }
	}
}
