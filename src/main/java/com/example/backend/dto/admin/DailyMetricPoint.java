package com.example.backend.dto.admin;

import java.time.LocalDate;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DailyMetricPoint {
    LocalDate date;
    long chatCount;
    long visitCount;
}
