package com.example.backend.service.impl;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.entity.DailyMetricsEntity;
import com.example.backend.repository.DailyMetricsRepository;
import com.example.backend.service.DailyMetricsService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DailyMetricsServiceImpl implements DailyMetricsService {

    private final DailyMetricsRepository dailyMetricsRepository;

    @Override
    @Transactional
    public void increaseUserCount() {
        LocalDate today = LocalDate.now();
        if (dailyMetricsRepository.incrementDailyUsers(today) == 0) {
            DailyMetricsEntity metrics = new DailyMetricsEntity(today, 1, 0);
            dailyMetricsRepository.save(metrics);
        }
    }

    @Override
    @Transactional
    public void increaseChatCount() {
        LocalDate today = LocalDate.now();
        if (dailyMetricsRepository.incrementDailyChats(today) == 0) {
            DailyMetricsEntity metrics = new DailyMetricsEntity(today, 0, 1);
            dailyMetricsRepository.save(metrics);
        }
    }
}
