package com.example.backend.security;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

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

    // ★ 토큰 검사 제외 경로 (패턴 지원)
    private static final List<String> EXCLUDE_PATTERNS = List.of(
            "/api/auth/social/google/login",
            "/api/auth/social/google/callback",
            "/api/auth/login",
            "/api/users/register",
            "/api/auth/refresh",
            "/api/users/find-id",
            "/api/users/find-password", // 비번찾기
            "/api/auth/reset-password", // 임시비번 발급
            "/api/auth/social/kakao",
            "/actuator/health",
            "/error",
            "/api/users/check-email",
            "/favicon.ico"
    // "/api/posts" // 테스트 겸 게시글 확인은 가능하게 수정
    );

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    private boolean isExcluded(@NonNull String uri) {
        for (String pattern : EXCLUDE_PATTERNS) {
            if (PATH_MATCHER.match(pattern, uri))
                return true;
        }
        return false;
    }

    // ★ OPTIONS(프리플라이트) + 화이트리스트는 아예 필터 스킵
    @Override
    protected boolean shouldNotFilter(@Nonnull HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()))
            return true;
        return isExcluded(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
            @Nonnull HttpServletRequest request,
            @Nonnull HttpServletResponse response,
            @Nonnull FilterChain filterChain)
            throws ServletException, IOException {

        final String path = request.getRequestURI();
        final String authHeader = request.getHeader("Authorization");
        log.debug("[JWT] URI={}, Authorization={}", path, authHeader);

        String token = null;

        // 1) Authorization Bearer 토큰 우선 추출
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            log.debug("[JWT] Bearer token extracted");
        } else {
            // 2) 쿠키에서 jwt 토큰 보조 추출
            if (request.getCookies() != null) {
                for (var cookie : request.getCookies()) {
                    if ("jwt".equals(cookie.getName())) {
                        token = cookie.getValue();
                        log.debug("[JWT] Cookie token extracted");
                        break;
                    }
                }
            }
        }

        // ★ 보호 경로인데 토큰이 전혀 없으면 401
        if (token == null || token.isBlank()) {
            log.warn("[JWT] No token for protected resource → 401");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        try {
            // 3) 토큰 유효성 검사
            if (!jwtUtil.validateToken(token)) {
                log.warn("[JWT] Token validation failed → 401");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }

            final String email = jwtUtil.getEmailFromToken(token);
            if (email == null || email.isBlank()) {
                log.warn("[JWT] Email missing in token → 401");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }

            // 4) 사용자 로드 & SecurityContext 설정
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            if (userDetails == null) {
                log.warn("[JWT] UserDetails not found: {}", email);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }

            var authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null,
                    userDetails.getAuthorities() != null ? userDetails.getAuthorities() : Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("[JWT] Auth success for {}", email);

            filterChain.doFilter(request, response);

        } catch (Exception e) {
            log.warn("[JWT] Exception: {}", e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        }
    }
}