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

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@EnableWebSecurity
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // CORS는 등록된 CorsConfigurationSource를 사용하여 프리플라이트/본요청 헤더를 처리한다. [12][7]
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // 기존 빈 사용 [12]
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // JWT 쿠키 기반이지만 서버 세션은 사용하지 않음(Stateless) [12]
            // 현재 설계에 맞춰 모든 엔드포인트는 일단 허용, 실제 인증 요구는 JWT 필터 및 컨트롤러/서비스에서 처리
            // 보호/공개를 시큐리티 규칙으로 재분리할 경우 아래 authorizeHttpRequests를 조정한다. [12]
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            )
            .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()))
            .formLogin(formLogin -> formLogin.disable())
            .exceptionHandling(ex -> ex
                // 인증 필요 경로에서 인증이 비어있는 경우(향후 authenticated() 사용 시) 401을 일관되게 반환 [12]
                .authenticationEntryPoint((req, res, ex1) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                // 권한 부족 시 403 반환 [12]
                .accessDeniedHandler((req, res, ex2) -> res.sendError(HttpServletResponse.SC_FORBIDDEN))
            );

        // JWT 필터를 UsernamePasswordAuthenticationFilter 앞에 배치 (기존 동작 유지) [12]
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

        // 허용 Origin (정확한 출처만 명시; 백엔드는 "요청 출처"가 아니므로 일반적으로 포함하지 않음) [14]
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",              // 개발 프런트 [12]
            "https://mind-bridge-zeta.vercel.app" // 운영 프런트 [12]
            // "http://localhost:5173",            // Vite 등 추가 로컬 포트 사용 시 즉시 활성화 [14]
            // "https://*.vercel.app"              // 서브도메인 확장 필요 시 allowedOriginPatterns로 전환하여 사용 [2]
        ));

        // allowCredentials: 쿠키/자격 증명 전송 허용 (HttpOnly JWT 쿠키를 위한 필수 조건) [2][13]
        configuration.setAllowCredentials(true);

        // 허용 메서드 [12]
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // 허용 헤더: 레거시 Authorization + 일반 헤더 (필요 시 추가) [11][9]
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin"
        ));

        // 필요 시 프런트에서 읽어야 하는 응답 헤더를 노출(exposed) [12]
        // 예: Access-Control-Expose-Headers: "Authorization", "X-Total-Count" 등
        // configuration.setExposedHeaders(Arrays.asList(
        //     "Authorization",
        //     "X-Total-Count"
        // ));

        // 프리플라이트 캐시 시간(초) [6]
        // configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // allowedOriginPatterns로 패턴 허용을 사용할 경우:
        // - setAllowedOrigins 대신 setAllowedOriginPatterns 사용 (allowCredentials(true)와 함께 와일드카드 패턴 가능) [2]
        // 예시(주석 대기):
        // CorsConfiguration patternConfig = new CorsConfiguration();
        // patternConfig.setAllowCredentials(true);
        // patternConfig.setAllowedOriginPatterns(List.of("https://*.vercel.app"));
        // patternConfig.setAllowedMethods(configuration.getAllowedMethods());
        // patternConfig.setAllowedHeaders(configuration.getAllowedHeaders());
        // source.registerCorsConfiguration("/**", patternConfig);
        // return source;

        // 기본: 명시 원본 허용 설정 적용
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
