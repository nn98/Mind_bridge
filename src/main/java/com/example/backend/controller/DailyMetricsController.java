package com.example.backend.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.entity.DailyMetricsEntity;
import com.example.backend.repository.DailyMetricsRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
public class DailyMetricsController {

    private final DailyMetricsRepository dailyMetricsRepository;

    //오늘 날짜 기준 조회
    @GetMapping("/today") 
    public ResponseEntity<DailyMetricsEntity> getTodayMetrics() {
        LocalDate today = LocalDate.now();
        return dailyMetricsRepository.findById(today)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    //특정 기간 조회  
    @GetMapping("/range") 
    public List<DailyMetricsEntity> getMetricsRange(
            @RequestParam("start") LocalDate start,
            @RequestParam("end") LocalDate end) {
        return dailyMetricsRepository.findAllByStatDateBetween(start, end);
    }

}
