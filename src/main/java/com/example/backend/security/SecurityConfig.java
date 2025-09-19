package com.example.backend.security;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@EnableWebSecurity
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper om) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 공개 엔드포인트
                .requestMatchers(
                    "/api/users/register",
                    "/api/users/availability",
                    "/api/auth/find-id",
                    "/api/auth/login",
                    "/api/auth/reset-password",
                    "/api/auth/social/**",   // login, callback 포함
                    "/api/posts/public",
                    "/api/posts/recent",
                    "/api/posts/*",          // /api/posts/{id} 공개 조회
                    "/actuator/health",
                    "/error",
                    "/favicon.ico",
                    "/api/emotion/analyze",  // 감정 분석 엔드포인트 공개
                    "/api/chat/message/save", // 채팅 메시지 저장 엔드포인트 공개
                    "/api/chat/analysis/save" // 상담 분석 저장 엔드포인트 공개
                ).permitAll()

                // 관리자 URL (다음 단계에서 @PreAuthorize로 보강)
                .requestMatchers("/api/admin/**").authenticated()

                // 사용자 계정 관련
                .requestMatchers("/api/users/account/**").authenticated()
                .requestMatchers("/api/users/account").authenticated()

                // 채팅 관련
                .requestMatchers("/api/chat/**").authenticated()

                // 게시글 쓰기/수정/삭제는 인증 필요
                .requestMatchers("/api/posts/my").authenticated()
                .requestMatchers("/api/posts/**").authenticated()

                // 기타는 기본 허용 범위에서 제외하고 보호
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()))
            .formLogin(formLogin -> formLogin.disable())
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(JsonAuthHandlers.authenticationEntryPoint(om))
                .accessDeniedHandler(JsonAuthHandlers.accessDeniedHandler(om))
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    /**
     * 글로벌 CORS 설정
     * - withCredentials(true)인 브라우저 요청이 쿠키(HttpOnly JWT)를 전송할 수 있도록 Access-Control-Allow-Credentials 허용. [2][13]
     * - allowCredentials(true)일 때는 와일드카드(*)를 사용할 수 없으므로, 구체 Origin 또는 패턴만 허용. [2]
     * - Authorization 헤더 및 일반 헤더를 허용하여 프리플라이트 실패를 방지. [11][9]
     * - 확장 가능 항목들은 주석으로 즉시 활성화 가능하게 포함.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "https://mind-bridge-zeta.vercel.app",
            "https://nasejong.shop/"
        ));
        configuration.setAllowCredentials(true);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin"
        ));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // AuthenticationManager는 일부 인증 플로우(폼 로그인 미사용)에서 필요할 수 있어 유지 [12]
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
