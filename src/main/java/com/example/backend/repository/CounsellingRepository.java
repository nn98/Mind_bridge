package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.CounsellingEntity;

public interface CounsellingRepository extends JpaRepository<CounsellingEntity, Long> {

    // 이메일 + 이름 으로 상담 내역 조회
    List<CounsellingEntity> findAllByUserEmailAndUserNameOrderByCounselIdDesc(String userEmail, String userName); 
}
