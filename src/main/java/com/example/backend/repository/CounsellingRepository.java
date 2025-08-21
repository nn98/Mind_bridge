package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.CounsellingEntity;


public interface CounsellingRepository extends JpaRepository<CounsellingEntity, Long> {

    List<CounsellingEntity> findByEmail(String email);
    
}
