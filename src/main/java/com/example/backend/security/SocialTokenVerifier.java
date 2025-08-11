package com.example.backend.security;

import java.util.Map;

import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class SocialTokenVerifier {

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 소셜 토큰 검증 후 이메일 반환
     * @param token - 소셜 액세스 토큰
     * @param provider - "google", "facebook" 등
     * @return 이메일 또는 null
     */
    public String verify(String token, String provider) {
        try {
            switch (provider.toLowerCase()) {
                case "google":
                    return verifyGoogleToken(token);
                case "facebook":
                    return verifyFacebookToken(token);
                default:
                    log.warn("지원하지 않는 소셜 로그인 provider: {}", provider);
                    return null;
            }
        } catch (Exception e) {
            log.error("소셜 토큰 검증 실패: {}", e.getMessage());
            return null;
        }
    }

    private String verifyGoogleToken(String token) {
        // Google 토큰 검증 엔드포인트
        String url = "https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=" + token;
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, null, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            String email = (String) response.getBody().get("email");
            log.info("Google 토큰 검증 성공, email={}", email);
            return email;
        }
        return null;
    }

    private String verifyFacebookToken(String token) {
        // Facebook 토큰 검증 엔드포인트
        String url = "https://graph.facebook.com/me?fields=email&access_token=" + token;
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, null, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            String email = (String) response.getBody().get("email");
            log.info("Facebook 토큰 검증 성공, email={}", email);
            return email;
        }
        return null;
    }
}
