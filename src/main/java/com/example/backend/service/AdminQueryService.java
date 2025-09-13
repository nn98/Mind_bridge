package com.example.backend.service;

import com.example.backend.dto.admin.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface AdminQueryService {

    // 대시보드 요약
    AdminStats getAdminStats();

    // 사용자
    Page<AdminUserRow> findUsers(AdminUserSearchRequest request, Pageable pageable);
    AdminUserDetail getUserDetail(Long id);

    // 게시글
    Page<AdminPostRow> findPosts(AdminPostSearchRequest request, Pageable pageable);
    AdminPostDetail getPostDetail(Long id);
    void updatePostVisibility(Long id, String visibility);
    void deletePost(Long id, String reason);

    // 지표
    DailyMetricPoint getTodayMetrics();
    List<DailyMetricPoint> getDailyRange(LocalDate start, LocalDate end);
    List<WeeklyMetricPoint> getWeeklyMetrics(int weeks);
    UserDistribution getUserDistribution();
}
