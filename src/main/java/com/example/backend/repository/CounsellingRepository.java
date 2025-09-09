package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.CounsellingEntity;


public interface CounsellingRepository extends JpaRepository<CounsellingEntity, Long> {
}

