package com.example.backend.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "daily_metrics")
@Getter
@Setter
public class DailyMetricsEntity {

    @Id
    private LocalDate statDate; // 날짜별 PK

    @Column(nullable = false)
    private Integer loginCount = 0; // 로그인 수 누적

    @Column(nullable = false)
    private Integer chatCount = 0;  // 채팅 종료 수 누적

    // 생성자
    public DailyMetricsEntity() {}
    
    public DailyMetricsEntity(LocalDate statDate, Integer loginCount, Integer chatCount) {
        this.statDate = statDate;
        this.loginCount = loginCount;
        this.chatCount = chatCount;
    }
}
