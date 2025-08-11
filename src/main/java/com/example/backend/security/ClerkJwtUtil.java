package com.example.backend.security;

import java.net.URL;
import java.security.interfaces.RSAPublicKey;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.UrlJwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;

public class ClerkJwtUtil {

    // 기본 허용 issuer (필요시 확장 가능)
    private static final String[] ALLOWED_ISSUERS = {
        "https://api.clerk.dev",
        "https://awaited-parrot-63.clerk.accounts.dev",
    };

    public static DecodedJWT verifyClerkToken(String token) throws Exception {
        DecodedJWT jwt = JWT.decode(token);

        String issuer = jwt.getIssuer();

        System.out.println("토큰 kid: " + jwt.getKeyId());
        System.out.println("토큰 iss: " + issuer);
        System.out.println("토큰 만료 시간: " + jwt.getExpiresAt());

        if (issuer == null || issuer.isEmpty()) {
            throw new Exception("Issuer claim is missing");
        }

        // 허용된 issuer인지 확인 (필요에 따라 정규식, 와일드카드 패턴으로 확장 가능)
        boolean allowedIssuer = false;
        for (String allowed : ALLOWED_ISSUERS) {
            if (issuer.equalsIgnoreCase(allowed)) {
                allowedIssuer = true;
                break;
            }
        }
        if (!allowedIssuer) {
            throw new Exception("Issuer is not allowed: " + issuer);
        }

        // JWKS URL 생성
        String jwksUrl = issuer + "/.well-known/jwks.json";
        UrlJwkProvider provider;

        try {
            provider = new UrlJwkProvider(new URL(jwksUrl));
        } catch (Exception e) {
            System.err.println("JWKS URL 접근 실패: " + jwksUrl);
            e.printStackTrace();
            throw new Exception("JWKS URL is invalid or unreachable: " + jwksUrl, e);
        }

        Jwk jwk;
        try {
            jwk = provider.get(jwt.getKeyId());
        } catch (Exception e) {
            System.err.println("키 조회 실패, kid: " + jwt.getKeyId());
            e.printStackTrace();
            throw new Exception("Failed to get JWK for kid: " + jwt.getKeyId(), e);
        }

        Algorithm algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);

        try {
            return JWT.require(algorithm)
                    .withIssuer(issuer)
                    .build()
                    .verify(token);
        } catch (Exception e) {
            System.err.println("토큰 서명 검증 실패");
            e.printStackTrace();
            throw e;
        }
    }
}
