package com.example.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByNickname(String nickname);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);  // 추가

    Optional<UserEntity> findByPhoneNumberAndNickname(String phoneNumber, String nickname); //폰번,닉네임으로 아이디 찾기
    
    
}
