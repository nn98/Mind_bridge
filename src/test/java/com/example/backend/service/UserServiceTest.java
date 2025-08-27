// src/test/java/com/example/backend/service/UserServiceTest.java
package com.example.backend.service;

import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.RegistrationRequest;
import com.example.backend.dto.user.Summary;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("회원가입 성공")
    void testRegisterSuccess() {
        // Given
        RegistrationRequest request = new RegistrationRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setNickname("testuser");
        request.setGender("M");
        request.setAge(25);

        UserEntity savedUser = new UserEntity();
        savedUser.setId(1L);
        savedUser.setEmail("test@example.com");
        savedUser.setNickname("testuser");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByNickname("testuser")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(UserEntity.class))).thenReturn(savedUser);

        // When
        Profile result = userService.register(request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("test@example.com");
        assertThat(result.getNickname()).isEqualTo("testuser");

        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository).existsByNickname("testuser");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("회원가입 실패 - 중복 이메일")
    void testRegisterFailureDuplicateEmail() {
        // Given
        RegistrationRequest request = new RegistrationRequest();
        request.setEmail("duplicate@example.com");
        request.setNickname("testuser");

        when(userRepository.existsByEmail("duplicate@example.com")).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("이미 사용중인 이메일입니다.");

        verify(userRepository).existsByEmail("duplicate@example.com");
        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("사용자 정보 업데이트 성공")
    void testUpdateUserSuccess() {
        // Given
        String email = "test@example.com";
        UpdateRequest request = new UpdateRequest();
        request.setNickname("updatednick");
        request.setMentalState("good");

        UserEntity existingUser = new UserEntity();
        existingUser.setId(1L);
        existingUser.setEmail(email);
        existingUser.setNickname("oldnick");

        UserEntity updatedUser = new UserEntity();
        updatedUser.setId(1L);
        updatedUser.setEmail(email);
        updatedUser.setNickname("updatednick");
        updatedUser.setMentalState("good");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(existingUser));
        when(userRepository.existsByNickname("updatednick")).thenReturn(false);
        when(userRepository.save(any(UserEntity.class))).thenReturn(updatedUser);

        // When
        Profile result = userService.updateUser(email, request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getNickname()).isEqualTo("updatednick");
        assertThat(result.getMentalState()).isEqualTo("good");

        verify(userRepository).findByEmail(email);
        verify(userRepository).existsByNickname("updatednick");
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("사용자 조회 - 이메일로 성공")
    void testGetUserByEmailSuccess() {
        // Given
        String email = "test@example.com";
        UserEntity user = new UserEntity();
        user.setId(1L);
        user.setEmail(email);
        user.setNickname("testuser");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        // When
        Optional<Profile> result = userService.getUserByEmail(email);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo(email);
        assertThat(result.get().getNickname()).isEqualTo("testuser");

        verify(userRepository).findByEmail(email);
    }

    @Test
    @DisplayName("사용자 삭제 성공")
    void testDeleteUserSuccess() {
        // Given
        String email = "test@example.com";
        UserEntity user = new UserEntity();
        user.setId(1L);
        user.setEmail(email);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        doNothing().when(userRepository).delete(user);

        // When
        userService.deleteUser(email);

        // Then
        verify(userRepository).findByEmail(email);
        verify(userRepository).delete(user);
    }

    @Test
    @DisplayName("이메일 사용 가능 확인 - 사용 가능")
    void testIsEmailAvailable() {
        // Given
        String email = "available@example.com";
        when(userRepository.existsByEmail(email)).thenReturn(false);

        // When
        boolean result = userService.isEmailAvailable(email);

        // Then
        assertThat(result).isTrue();
        verify(userRepository).existsByEmail(email);
    }
}
