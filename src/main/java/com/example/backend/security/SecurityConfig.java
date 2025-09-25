package com.example.backend.security;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
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
@EnableMethodSecurity(prePostEnabled = true)
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
                .requestMatchers(
                    "/api/users/register",
                    "/api/users/availability",
                    "/api/auth/find-id",
                    "/api/auth/login",
                    "/api/auth/reset-password",
                    "/api/auth/social/**",
                    "/api/posts/public",
                    "/api/posts/recent",
                    "/actuator/health",
                    "/error",
                    "/favicon.ico",
                    "/api/emotion/analyze",
                    "/api/chat/message/save",
                    "/api/chat/session/save",
                    "/internal/metrics/http-server-requests",
                    "/api/metrics/**"
                ).permitAll()

                .requestMatchers(HttpMethod.GET, "/api/posts/*").permitAll()  // 개별 게시글 조회
                .requestMatchers(HttpMethod.POST, "/api/posts/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/posts/**").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/posts/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/posts/**").authenticated()
                .requestMatchers("/api/posts/**").authenticated()  // 나머지 모든 게시글 관련

                .requestMatchers("/api/admin/**").authenticated()

                .requestMatchers("/api/users/account/**").authenticated()
                .requestMatchers("/api/users/account").authenticated()

                .requestMatchers("/api/chat/**").authenticated()

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
