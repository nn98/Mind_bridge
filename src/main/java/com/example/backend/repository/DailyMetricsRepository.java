package com.example.backend.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.DailyMetricsEntity;

@Repository
public interface DailyMetricsRepository extends JpaRepository<DailyMetricsEntity, LocalDate> {

    //접속자 수
    @Modifying
    @Query("UPDATE DailyMetricsEntity d SET d.loginCount = d.loginCount + 1 WHERE d.statDate = :date")
    int incrementDailyUsers(@Param("date") LocalDate date);

    //채팅 종료 수
    @Modifying
    @Query("UPDATE DailyMetricsEntity d SET d.chatCount = d.chatCount + 1 WHERE d.statDate = :date")
    int incrementDailyChats(@Param("date") LocalDate date);

    List<DailyMetricsEntity> findAllByStatDateBetween(LocalDate start, LocalDate end);

}
