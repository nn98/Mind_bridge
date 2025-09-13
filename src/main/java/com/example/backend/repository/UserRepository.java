package com.example.backend.repository;

import com.example.backend.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long>, JpaSpecificationExecutor<UserEntity> {

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByNickname(String nickname);

    Optional<UserEntity> findByPhoneNumberAndNickname(String phoneNumber, String nickname);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    @Modifying
    @Transactional
    @Query("update UserEntity u set u.lastLoginAt = CURRENT_TIMESTAMP where u.email = :email")
    int touchLastLogin(@Param("email") String email);

    @Query("SELECT u.gender, COUNT(u) FROM UserEntity u WHERE u.gender IS NOT NULL GROUP BY u.gender")
    Map<String, Long> countByGenderGroup();

    @Query("SELECT CASE " +
           "WHEN u.age BETWEEN 10 AND 19 THEN '10s' " +
           "WHEN u.age BETWEEN 20 AND 29 THEN '20s' " +
           "WHEN u.age BETWEEN 30 AND 39 THEN '30s' " +
           "WHEN u.age BETWEEN 40 AND 49 THEN '40s' " +
           "WHEN u.age BETWEEN 50 AND 59 THEN '50s' " +
           "WHEN u.age >= 60 THEN '60s' " +
           "ELSE 'Unknown' END, " +
           "COUNT(u) FROM UserEntity u GROUP BY CASE " +
           "WHEN u.age BETWEEN 10 AND 19 THEN '10s' " +
           "WHEN u.age BETWEEN 20 AND 29 THEN '20s' " +
           "WHEN u.age BETWEEN 30 AND 39 THEN '30s' " +
           "WHEN u.age BETWEEN 40 AND 49 THEN '40s' " +
           "WHEN u.age BETWEEN 50 AND 59 THEN '50s' " +
           "WHEN u.age >= 60 THEN '60s' " +
           "ELSE 'Unknown' END")
    Map<String, Long> countByAgeBucketGroup();
}

