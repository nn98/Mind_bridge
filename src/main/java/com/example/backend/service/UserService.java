package com.example.backend.service;

import java.util.Optional;

import com.example.backend.dto.user.ChangePasswordRequest;
import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.RegistrationRequest;
import com.example.backend.dto.user.Summary;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.entity.UserEntity;

public interface UserService {
    Profile register(RegistrationRequest request);
    Profile updateUser(String email, UpdateRequest request);
    Optional<Profile> getUserByEmail(String email);
    Optional<Summary> getUserByNickname(String nickname);
    void changePassword(String email, ChangePasswordRequest request);
    void deleteUser(String email);
    boolean isEmailAvailable(String email);
    boolean isNicknameAvailable(String nickname);
    UserEntity findOrCreateSocialUser(String email, String nickname, String provider);
    void changePasswordWithCurrentCheck(String email, String currentPassword, String newPassword, String confirmPassword);
    public void changePasswordWithReAuth(String email, String currentPassword, String newPassword);
    public void deleteAccountWithReAuth(String email, String currentPassword);
}
