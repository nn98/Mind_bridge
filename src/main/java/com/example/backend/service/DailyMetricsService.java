package com.example.backend.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.entity.DailyMetricsEntity;
import com.example.backend.repository.DailyMetricsRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DailyMetricsService {

    private final DailyMetricsRepository dailyMetricsRepository;

    @Transactional
    public void increaseUserCount() {
        LocalDate today = LocalDate.now();
        if (dailyMetricsRepository.incrementDailyUsers(today) == 0) {
            DailyMetricsEntity metrics = new DailyMetricsEntity(today, 1, 0);
            dailyMetricsRepository.save(metrics);
        }
    }

    @Transactional
    public void increaseChatCount() {
        LocalDate today = LocalDate.now();
        if (dailyMetricsRepository.incrementDailyChats(today) == 0) {
            DailyMetricsEntity metrics = new DailyMetricsEntity(today, 0, 1);
            dailyMetricsRepository.save(metrics);
        }
    }
}
