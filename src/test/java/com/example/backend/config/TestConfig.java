// src/test/java/com/example/backend/config/TestConfig.java
package com.example.backend.config;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;

@TestConfiguration
public class TestConfig {

    @Bean
    @Primary
    public JavaMailSender testMailSender() {
        return new JavaMailSenderImpl() {
            @Override
            public void send(SimpleMailMessage simpleMessage) {
                System.out.println("📧 [테스트] 메일 전송 시뮬레이션");
                System.out.println("받는 사람: " + Arrays.toString(simpleMessage.getTo()));
                System.out.println("제목: " + simpleMessage.getSubject());
            }
        };
    }

    @Bean
    @Primary
    public RestTemplate testRestTemplate() {
        return Mockito.mock(RestTemplate.class);
    }

    @Bean
    @Primary
    public SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()  // 모든 요청 허용
                );

        return http.build();
    }
}
