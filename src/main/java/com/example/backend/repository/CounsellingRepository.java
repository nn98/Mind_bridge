package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.CounsellingEntity;


public interface CounsellingRepository extends JpaRepository<CounsellingEntity, Long> {

    //유저네임 , 유저이메일 기준으로 상담내역 찾기

    //
}

