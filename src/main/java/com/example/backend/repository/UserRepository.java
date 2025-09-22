package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long>, JpaSpecificationExecutor<UserEntity> {

    // === 기본 조회 ===
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByNickname(String nickname);
    Optional<UserEntity> findByPhoneNumberAndNickname(String phoneNumber, String nickname);

    // === 중복 확인 ===
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);

    // === 통계 쿼리 ===
    long countByRole(String role);

    // === 최근 사용자 조회 ===
    List<UserEntity> findTop10ByOrderByCreatedAtDesc();

    @Query("SELECT u FROM UserEntity u ORDER BY u.createdAt DESC LIMIT :limit")
    List<UserEntity> findTopNByOrderByCreatedAtDesc(@Param("limit") int limit);

    // === 로그인 시간 업데이트 ===
    @Modifying
    @Transactional
    @Query("UPDATE UserEntity u SET u.lastLoginAt = CURRENT_TIMESTAMP WHERE u.email = :email")
    int touchLastLogin(@Param("email") String email);

    // === 통계용 인터페이스 ===
    interface GenderCount {
        String getGender();
        Long getCnt();
    }

    interface AgeBucketCount {
        String getBucket();
        Long getCnt();
    }

    // === 성별 통계 ===
    @Query("SELECT u.gender as gender, count(u.userId) as cnt " +
        "FROM UserEntity u WHERE u.gender IS NOT NULL GROUP BY u.gender")
    List<GenderCount> countByGenderGroup();

    // === 연령대 통계 ===
    @Query("""
       SELECT 
         CASE 
           WHEN u.age BETWEEN 10 AND 19 THEN '10s'
           WHEN u.age BETWEEN 20 AND 29 THEN '20s'
           WHEN u.age BETWEEN 30 AND 39 THEN '30s'
           WHEN u.age BETWEEN 40 AND 49 THEN '40s'
           WHEN u.age BETWEEN 50 AND 59 THEN '50s'
           WHEN u.age >= 60 THEN '60s'
           ELSE 'Unknown'
         END as bucket,
         count(u.userId) as cnt
       FROM UserEntity u
       GROUP BY 
         CASE 
           WHEN u.age BETWEEN 10 AND 19 THEN '10s'
           WHEN u.age BETWEEN 20 AND 29 THEN '20s'
           WHEN u.age BETWEEN 30 AND 39 THEN '30s'
           WHEN u.age BETWEEN 40 AND 49 THEN '40s'
           WHEN u.age BETWEEN 50 AND 59 THEN '50s'
           WHEN u.age >= 60 THEN '60s'
           ELSE 'Unknown'
         END
       """)
    List<AgeBucketCount> countByAgeBucketGroup();

    // === 소셜 사용자 조회 ===
    @Query("SELECT u FROM UserEntity u WHERE u.provider = :provider AND u.socialId = :socialId")
    Optional<UserEntity> findByProviderAndSocialId(@Param("provider") String provider, @Param("socialId") String socialId);

    // === 활성/비활성 사용자 조회 ===
    @Query("SELECT u FROM UserEntity u WHERE u.lastLoginAt > :since ORDER BY u.lastLoginAt DESC")
    List<UserEntity> findActiveUsersSince(@Param("since") java.time.LocalDateTime since);
}
