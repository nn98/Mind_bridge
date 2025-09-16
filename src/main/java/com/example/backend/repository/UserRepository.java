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

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findByNickname(String nickname);

    Optional<UserEntity> findByPhoneNumberAndNickname(String phoneNumber, String nickname);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    public static interface GenderCount {
        String getGender();
        Long getCnt();
    }
    public static interface AgeBucketCount {
        String getBucket();
        Long getCnt();
    }

    @Modifying
    @Transactional
    @Query("update UserEntity u set u.lastLoginAt = CURRENT_TIMESTAMP where u.email = :email")
    int touchLastLogin(@Param("email") String email);

    @Query("select u.gender as gender, count(u.id) as cnt " +
        "from UserEntity u where u.gender is not null group by u.gender")
    List<GenderCount> countByGenderGroup();

    @Query("""
       select 
         case 
           when u.age between 10 and 19 then '10s'
           when u.age between 20 and 29 then '20s'
           when u.age between 30 and 39 then '30s'
           when u.age between 40 and 49 then '40s'
           when u.age between 50 and 59 then '50s'
           when u.age >= 60 then '60s'
           else 'Unknown'
         end as bucket,
         count(u.id) as cnt
       from UserEntity u
       group by 
         case 
           when u.age between 10 and 19 then '10s'
           when u.age between 20 and 29 then '20s'
           when u.age between 30 and 39 then '30s'
           when u.age between 40 and 49 then '40s'
           when u.age between 50 and 59 then '50s'
           when u.age >= 60 then '60s'
           else 'Unknown'
         end
       """)
    List<AgeBucketCount> countByAgeBucketGroup();
}

