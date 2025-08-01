package com.example.backend.security;

import com.auth0.jwk.*;
import com.auth0.jwt.JWT;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.algorithms.Algorithm;

import java.net.URL;
import java.security.interfaces.RSAPublicKey;

public class ClerkJwtUtil {

    private static final String ISSUER = "https://api.clerk.dev";
    private static final String JWKS_URL = "https://api.clerk.dev/.well-known/jwks.json";

    public static DecodedJWT verifyClerkToken(String token) throws Exception {
        DecodedJWT jwt = JWT.decode(token);
        UrlJwkProvider provider = new UrlJwkProvider(new URL(JWKS_URL));
        Jwk jwk = provider.get(jwt.getKeyId());
        Algorithm algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);

        return JWT.require(algorithm)
                .withIssuer(ISSUER)
                .build()
                .verify(token); // 예외 발생 시 인증 실패
    }
}
