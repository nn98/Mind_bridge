// src/test/java/com/example/backend/repository/UserRepositoryTest.java
package com.example.backend.repository;

import com.example.backend.entity.UserEntity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("이메일로 사용자 찾기")
    void testFindByEmail() {
        // Given
        UserEntity user = new UserEntity();
        user.setEmail("test@example.com");
        user.setNickname("testuser");
        user.setPassword("password");
        user.setRole("USER");
        user.setAge(25);
        user.setGender("M");

        entityManager.persistAndFlush(user);

        // When
        Optional<UserEntity> found = userRepository.findByEmail("test@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
        assertThat(found.get().getNickname()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("닉네임으로 사용자 찾기")
    void testFindByNickname() {
        // Given
        UserEntity user = new UserEntity();
        user.setEmail("test@example.com");
        user.setNickname("testuser");
        user.setPassword("password");
        user.setRole("USER");
        user.setAge(25);
        user.setGender("M");

        entityManager.persistAndFlush(user);

        // When
        Optional<UserEntity> found = userRepository.findByNickname("testuser");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
        assertThat(found.get().getNickname()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("이메일 존재 여부 확인 - 존재")
    void testExistsByEmailTrue() {
        // Given
        UserEntity user = new UserEntity();
        user.setEmail("existing@example.com");
        user.setNickname("existinguser");
        user.setPassword("password");
        user.setRole("USER");
        user.setAge(25);
        user.setGender("M");

        entityManager.persistAndFlush(user);

        // When
        boolean exists = userRepository.existsByEmail("existing@example.com");

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("이메일 존재 여부 확인 - 존재하지 않음")
    void testExistsByEmailFalse() {
        // When
        boolean exists = userRepository.existsByEmail("nonexistent@example.com");

        // Then
        assertThat(exists).isFalse();
    }
}
