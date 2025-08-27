package com.example.backend.service;

import java.util.Optional;
import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.RegistrationRequest;
import com.example.backend.dto.user.Summary;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.entity.UserEntity;

public interface UserService {
    Profile register(RegistrationRequest request);
    Profile updateUser(String email, UpdateRequest request);
    Profile changePassword(String email, String newPassword);
    Optional<Profile> getUserByEmail(String email);
    Optional<Summary> getUserByNickname(String nickname);
    void deleteUser(String email);
    boolean isEmailAvailable(String email);
    boolean isNicknameAvailable(String nickname);
    UserEntity findOrCreateSocialUser(String email, String nickname);
    UserEntity findOrCreateGoogleUser(String email, String nickname);
    UserEntity findOrCreateKakaoUser(String email, String nickname);
}
