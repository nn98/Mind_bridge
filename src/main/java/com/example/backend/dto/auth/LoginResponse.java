package com.example.backend.dto.auth;

import com.example.backend.dto.user.Profile;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {
    @JsonProperty("accessToken")
    String accessToken;

    @JsonProperty("refreshToken")
    String refreshToken; // null 가능(전략에 따라 미발급)

    @Builder.Default
    @JsonProperty("tokenType")
    String tokenType = "Bearer";

    @JsonProperty("expiresInSeconds")
    Long expiresInSeconds; // access 만료(초). null 허용

    @JsonProperty("profile")
    Profile profile; // 최소 프로필(노출 필드 제한)

    // 정적 팩토리: access만
    public static LoginResponse ofAccess(Profile profile, String accessToken, long expiresInSeconds) {
        return LoginResponse.builder()
            .accessToken(accessToken)
            .expiresInSeconds(expiresInSeconds)
            .profile(profile)
            .build();
    }

    // 정적 팩토리: access+refresh
    public static LoginResponse ofAccessRefresh(Profile profile, String accessToken, long expiresInSeconds, String refreshToken) {
        return LoginResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .expiresInSeconds(expiresInSeconds)
            .profile(profile)
            .build();
    }
}
