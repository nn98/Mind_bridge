package com.example.backend.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.auth0.jwt.interfaces.DecodedJWT;

import jakarta.annotation.Nonnull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
        @Nonnull HttpServletRequest request, 
        @Nonnull HttpServletResponse response, 
        @Nonnull FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        log.debug("Authorization Header: {}", authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Authorization 헤더가 없거나 Bearer 토큰 아님");
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // "Bearer " 이후 토큰

        boolean authenticated = false;

        // 1. Clerk 토큰 검증 시도
        try {
            DecodedJWT clerkJwt = ClerkJwtUtil.verifyClerkToken(token);
            String email = clerkJwt.getClaim("email").asString();
            if (email != null && !email.isEmpty()) {
                UsernamePasswordAuthenticationToken authentication
                        = new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER")) // 기본 권한 추가
                        );
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.info("Clerk 사용자 인증 성공: {}", email);
                authenticated = true;
            }
        } catch (Exception e) {
            log.info("Clerk 토큰 아님 또는 유효하지 않음: {}", e.getMessage());
        }

        // 2. 커스텀 토큰 검증 (fallback)
        if (!authenticated) {
            if (jwtUtil.validateToken(token)) {
                String email = jwtUtil.getEmailFromToken(token);
                log.debug("커스텀 사용자 이메일: {}", email);

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                if (userDetails != null) {
                    UsernamePasswordAuthenticationToken authentication
                            = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.info("커스텀 사용자 인증 성공: {}", email);
                    authenticated = true;
                } else {
                    log.warn("커스텀 사용자 정보를 찾을 수 없음");
                }
            } else {
                log.warn("커스텀 토큰 유효성 검사 실패");
            }
        }

        if (!authenticated) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
