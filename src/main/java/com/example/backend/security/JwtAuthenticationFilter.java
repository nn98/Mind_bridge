package com.example.backend.security;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;

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
    private final ObjectMapper objectMapper; // 추가 주입

    private static final List<String> EXCLUDE_PATTERNS = List.of(
        "/actuator/health",
        "/error",
        "/favicon.ico"
    );
    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    private boolean isExcluded(@NonNull String uri) {
        for (String pattern : EXCLUDE_PATTERNS) {
            if (PATH_MATCHER.match(pattern, uri)) return true;
        }
        return false;
    }

    @Override
    protected boolean shouldNotFilter(@Nonnull HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        return isExcluded(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(
        @Nonnull HttpServletRequest request,
        @Nonnull HttpServletResponse response,
        @Nonnull FilterChain filterChain
    ) throws ServletException, IOException {

        final String path = request.getRequestURI();
        final String authHeader = request.getHeader("Authorization");
        log.debug("[JWT] URI={}, Authorization={}", path, authHeader);

        String token = null;

        // 1) Authorization Bearer
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            log.debug("[JWT] Bearer token extracted");
        } else if (request.getCookies() != null) {
            // 2) Cookie fallback
            for (var cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    token = cookie.getValue();
                    log.debug("[JWT] Cookie token extracted");
                    break;
                }
            }
        }

        // 토큰이 아예 없으면 패스(보호/공개는 Security 매칭/메소드 보안에서 결정)
        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (!jwtUtil.validateToken(token)) {
                log.warn("[JWT] Token validation failed");
                ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
                pd.setTitle("Unauthorized");
                pd.setDetail("Invalid JWT token");
                pd.setInstance(java.net.URI.create(request.getRequestURI()));
                JsonAuthHandlers.writeJson(response, objectMapper, pd, HttpStatus.UNAUTHORIZED.value());
                return;
            }
            final String email = jwtUtil.getEmailFromToken(token);
            if (email == null || email.isBlank()) {
                log.warn("[JWT] Email missing in token");
                ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
                pd.setTitle("Unauthorized");
                pd.setDetail("Invalid token subject");
                pd.setInstance(java.net.URI.create(request.getRequestURI()));
                JsonAuthHandlers.writeJson(response, objectMapper, pd, HttpStatus.UNAUTHORIZED.value());
                return;
            }

            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            if (userDetails == null) {
                log.warn("[JWT] UserDetails not found: {}", email);
                ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
                pd.setTitle("Unauthorized");
                pd.setDetail("User not found");
                pd.setInstance(java.net.URI.create(request.getRequestURI()));
                JsonAuthHandlers.writeJson(response, objectMapper, pd, HttpStatus.UNAUTHORIZED.value());
                return;
            }

            var authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null,
                userDetails.getAuthorities() != null ? userDetails.getAuthorities() : Collections.emptyList()
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("[JWT] Auth success for {}", email);
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.warn("[JWT] Exception: {}", e.getMessage());
            ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
            pd.setTitle("Unauthorized");
            pd.setDetail("Authentication error");
            pd.setInstance(java.net.URI.create(request.getRequestURI()));
            JsonAuthHandlers.writeJson(response, objectMapper, pd, HttpStatus.UNAUTHORIZED.value());
        }
    }
}
