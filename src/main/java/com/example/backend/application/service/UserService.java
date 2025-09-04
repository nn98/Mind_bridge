package com.example.backend.application.service;

import java.util.Optional;
import com.example.backend.api.dto.user.Profile;
import com.example.backend.api.dto.user.RegistrationRequest;
import com.example.backend.api.dto.user.Summary;
import com.example.backend.api.dto.user.UpdateRequest;
import com.example.backend.infrastructure.persistence.entity.UserEntity;

public interface UserService {
    Profile register(RegistrationRequest request);
    Profile updateUser(String email, UpdateRequest request);
    Profile changePassword(String email, String newPassword);
    Optional<Profile> getUserByEmail(String email);
    Optional<Summary> getUserByNickname(String nickname);
    void deleteUser(String email);
    boolean isEmailAvailable(String email);
    boolean isNicknameAvailable(String nickname);
    UserEntity findOrCreateSocialUser(String email, String nickname, String provider);
}
