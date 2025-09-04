// dto/auth/LoginResponse.java
package com.example.backend.api.dto.auth;

import com.example.backend.api.dto.user.Profile;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LoginResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private Profile profile; // 로그인한 사용자 기본 정보

    public LoginResponse(String accessToken, Profile profile) {
        this.accessToken = accessToken;
        this.profile = profile;
    }
}
