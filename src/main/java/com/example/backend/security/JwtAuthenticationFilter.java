package com.example.backend.security;

import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.annotation.Nonnull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    private static final List<String> EXCLUDE_URLS = List.of(
            "/api/users/find-id",
            "/api/users/find-password",
            "/api/auth/social/kakao"  // 반드시 추가
    );

    @Override
    protected void doFilterInternal(
            @Nonnull HttpServletRequest request,
            @Nonnull HttpServletResponse response,
            @Nonnull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (EXCLUDE_URLS.contains(path)) {
            log.debug("인증 제외 URL 접근: {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        log.debug("Authorization Header: {}", authHeader);

        String token = null;

        // 1) Authorization 헤더에서 Bearer 토큰 추출 시도
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            log.debug("Authorization 헤더에서 추출된 토큰: {}", token);
        } else {
            log.warn("Authorization 헤더 없거나 Bearer 토큰 아님, 쿠키에서 토큰 검사 시도");
            // 2) 쿠키에서 jwt 토큰 추출 시도
            if (request.getCookies() != null) {
                for (var cookie : request.getCookies()) {
                    if ("jwt".equals(cookie.getName())) {
                        token = cookie.getValue();
                        log.debug("쿠키에서 추출된 토큰: {}", token);
                        break;
                    }
                }
            } else {
                log.warn("요청에 쿠키 없음");
            }
        }

        if (token == null) {
            log.warn("토큰을 찾지 못함, 인증 실패 처리");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        boolean authenticated = false;

        // 3. Clerk 토큰 검증 시도
        try {
            DecodedJWT clerkJwt = ClerkJwtUtil.verifyClerkToken(token);
            String email = clerkJwt.getClaim("email").asString();
            if (email != null && !email.isEmpty()) {
                UsernamePasswordAuthenticationToken authentication
                        = new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.info("Clerk 사용자 인증 성공: {}", email);
                authenticated = true;
            }
        } catch (Exception e) {
            log.info("Clerk 토큰 아님 또는 유효하지 않음: {}", e.getMessage());
        }

        // 4. 커스텀 JWT 검증
        if (!authenticated) {
            if (jwtUtil.validateToken(token)) {
                String email = jwtUtil.getEmailFromToken(token);
                log.debug("커스텀 토큰에서 읽은 이메일: {}", email);

                try {
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
                } catch (Exception e) {
                    log.error("커스텀 사용자 로드중 예외 발생: {}", e.getMessage());
                }
            } else {
                log.warn("커스텀 토큰 유효성 검사 실패");
            }
        }

        if (!authenticated) {
            log.warn("인증 실패, 401 응답");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
