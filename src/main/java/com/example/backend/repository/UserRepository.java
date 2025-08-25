package com.example.backend.repository;

import com.example.backend.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByNickname(String nickname);

    Optional<UserEntity> findByPhoneNumberAndNickname(String phoneNumber, String nickname);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);
}
