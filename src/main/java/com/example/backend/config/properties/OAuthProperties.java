package com.example.backend.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "oauth")
public class OAuthProperties {

	private final Provider google = new Provider();
	private final Provider kakao = new Provider();

	public Provider getGoogle() { return google; }
	public Provider getKakao() { return kakao; }

	public static class Provider {
		private String clientId;
		private String clientSecret; // nullable for kakao
		private String redirectUri;

		public String getClientId() { return clientId; }
		public void setClientId(String clientId) { this.clientId = clientId; }
		public String getClientSecret() { return clientSecret; }
		public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
		public String getRedirectUri() { return redirectUri; }
		public void setRedirectUri(String redirectUri) { this.redirectUri = redirectUri; }
	}
}
