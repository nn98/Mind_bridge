package com.example.backend.security;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class TestMailConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        return new JavaMailSenderImpl() {
            @Override
            public void send(SimpleMailMessage simpleMessage) {
                System.out.println("🟢 [MOCK 메일 전송됨 - 실제 전송 X]");
                System.out.println("받는 사람: " + Arrays.toString(simpleMessage.getTo()));
                System.out.println("제목: " + simpleMessage.getSubject());
                System.out.println("내용: " + simpleMessage.getText());
            }
        };
    }
}
