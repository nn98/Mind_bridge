package com.example.backend.service;

import java.util.List;
import java.util.Optional;

import com.example.backend.dto.user.ChangePasswordRequest;
import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.RegistrationRequest;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.entity.UserEntity;

public interface UserService {

    // === 사용자 등록/수정/삭제 ===
    Profile register(RegistrationRequest request);
    Profile updateUser(String email, UpdateRequest request);
    void deleteUser(String email);
    void deleteAccountWithReAuth(String email, String currentPassword);

    // === 사용자 조회 ===
    Optional<Profile> getUserByEmail(String email);
    Optional<Profile> getUserById(Long userId);
    Optional<Profile> getUserByNickname(String nickname);
    Optional<Profile> findUserByPhoneAndNickname(String phoneNumber, String nickname);

    // === 가용성 확인 ===
    boolean isEmailAvailable(String email);
    boolean isNicknameAvailable(String nickname);

    // === 비밀번호 관리 ===
    void changePassword(String email, ChangePasswordRequest request);
    void changePasswordWithReAuth(String email, String currentPassword, String newPassword);
    void changePasswordWithCurrentCheck(String email, String currentPassword, String newPassword, String confirmPassword);

    // === 소셜 사용자 관리 ===
    UserEntity findOrCreateSocialUser(String email, String nickname, String provider);

    // === 통계 및 유틸리티 ===
    long getUserCount();
    long getUserCountByRole(String role);
    List<Profile> getRecentUsers();
    List<Profile> getRecentUsers(int limit);
    void updateLastLoginTime(String email);
}
