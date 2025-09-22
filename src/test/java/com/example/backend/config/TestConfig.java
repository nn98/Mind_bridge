package com.example.backend.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.backend.mapper.UserMapper;
import com.example.backend.mapper.UserMapperImpl;

/**
 * 테스트용 설정 - MapStruct 구현체와 의존성 제공
 */
@TestConfiguration
public class TestConfig {

	@Bean
	@Primary
	public PasswordEncoder testPasswordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	@Primary
	public UserMapper testUserMapper() {
		return new UserMapperImpl(); // MapStruct 생성 구현체
	}
}
