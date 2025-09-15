package com.example.backend.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.admin.AdminPostDetail;
import com.example.backend.dto.admin.AdminPostRow;
import com.example.backend.dto.admin.AdminPostSearchRequest;
import com.example.backend.dto.admin.AdminStats;
import com.example.backend.dto.admin.AdminUserDetail;
import com.example.backend.dto.admin.AdminUserRow;
import com.example.backend.dto.admin.AdminUserSearchRequest;
import com.example.backend.dto.admin.DailyMetricPoint;
import com.example.backend.dto.admin.UserDistribution;
import com.example.backend.dto.admin.VisibilityUpdateRequest;
import com.example.backend.dto.admin.WeeklyMetricPoint;
import com.example.backend.dto.common.ApiResponse;
import com.example.backend.service.AdminQueryService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminQueryService adminQueryService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStats>> getAdminStats() {
        AdminStats stats = adminQueryService.getAdminStats();
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(ApiResponse.success(stats));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<AdminUserRow>>> getUsers(
        @ModelAttribute @Valid AdminUserSearchRequest searchRequest,
        Pageable pageable
    ) {
        Page<AdminUserRow> result = adminQueryService.findUsers(searchRequest, pageable);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(ApiResponse.success(result));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserDetail>> getUser(@PathVariable Long id) {
        AdminUserDetail detail = adminQueryService.getUserDetail(id);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(ApiResponse.success(detail));
    }

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Page<AdminPostRow>>> getPosts(
        @ModelAttribute @Valid AdminPostSearchRequest searchRequest,
        Pageable pageable
    ) {
        Page<AdminPostRow> result = adminQueryService.findPosts(searchRequest, pageable);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(ApiResponse.success(result));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<AdminPostDetail>> getPost(@PathVariable Long id) {
        AdminPostDetail detail = adminQueryService.getPostDetail(id);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(ApiResponse.success(detail));
    }

    @PatchMapping("/posts/{id}/visibility")
    public ResponseEntity<ApiResponse<Object>> updatePostVisibility(
        @PathVariable Long id,
        @RequestBody @Validated VisibilityUpdateRequest request
    ) {
        adminQueryService.updatePostVisibility(id, request.getVisibility());
        return ResponseEntity.ok(ApiResponse.success(null, "게시글 공개 상태가 성공적으로 변경되었습니다."));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<Object>> deletePost(@PathVariable Long id, @RequestParam(required = false) String reason) {
        adminQueryService.deletePost(id, reason);
        return ResponseEntity.ok(ApiResponse.success(null, "게시글이 성공적으로 삭제되었습니다."));
    }

    @GetMapping("/metrics/today")
    public ResponseEntity<ApiResponse<DailyMetricPoint>> todayMetrics() {
        DailyMetricPoint today = adminQueryService.getTodayMetrics();
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(ApiResponse.success(today));
    }

    @GetMapping("/metrics/range")
    public ResponseEntity<ApiResponse<List<DailyMetricPoint>>> metricsRange(
        @RequestParam @NotNull LocalDate start,
        @RequestParam @NotNull LocalDate end
    ) {
        List<DailyMetricPoint> list = adminQueryService.getDailyRange(start, end);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(ApiResponse.success(list));
    }

    @GetMapping("/metrics/weekly")
    public ResponseEntity<ApiResponse<List<WeeklyMetricPoint>>> metricsWeekly(@RequestParam(defaultValue = "8") @Min(1) @Max(52) int weeks) {
        List<WeeklyMetricPoint> list = adminQueryService.getWeeklyMetrics(weeks);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(ApiResponse.success(list));
    }

    @GetMapping("/metrics/users/distribution")
    public ResponseEntity<ApiResponse<UserDistribution>> userDistribution() {
        UserDistribution dist = adminQueryService.getUserDistribution();
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(ApiResponse.success(dist));
    }
}
