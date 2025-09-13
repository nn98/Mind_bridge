package com.example.backend.dto.admin;

import java.time.LocalDate;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class WeeklyMetricPoint {
    int year;
    int week; // ISO week
    long chatCount;
    long visitCount;
    LocalDate start; // 주 시작(월)
    LocalDate end;   // 주 끝(일)
}
