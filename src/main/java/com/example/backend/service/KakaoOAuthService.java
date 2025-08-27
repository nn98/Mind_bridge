// service/KakaoOAuthService.java
package com.example.backend.service;

import java.util.Map;

public interface KakaoOAuthService {

    String getAuthorizationUrl();

    String requestAccessToken(String code);

    Map<String, Object> requestUserInfo(String accessToken);

    Map<String, Object> extractJwtPayload(Map<String, Object> userInfo);

    Map<String, String> validateAndExtractUserInfo(Map<String, Object> userInfo);
}
