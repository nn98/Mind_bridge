package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.Counselling;

@Repository
public interface CounsellingRepository extends JpaRepository<Counselling, Long> {
    // 필요 시 커스텀 메서드 작성 가능하니 추가하슈
}
