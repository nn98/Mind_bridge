package com.example.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.infrastructure.persistence.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByNickname(String nickname);

    Optional<UserEntity> findByPhoneNumberAndNickname(String phoneNumber, String nickname);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    @Modifying
    @Transactional
    @Query("update UserEntity u set u.lastLoginAt = CURRENT_TIMESTAMP where u.email = :email")
    int touchLastLogin(@Param("email") String email);
}
