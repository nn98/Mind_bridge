package com.example.backend.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.backend.dto.admin.AdminPostRow;
import com.example.backend.dto.admin.AdminStats;
import com.example.backend.dto.admin.AdminUserDetail;
import com.example.backend.dto.admin.AdminUserRow;
import com.example.backend.dto.admin.AdminUserSearchRequest;
import com.example.backend.dto.admin.DailyMetricPoint;
import com.example.backend.service.AdminQueryService;

@WebMvcTest(
    controllers = AdminController.class,
    excludeFilters = {
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {
            com.example.backend.security.JwtAuthenticationFilter.class,
            com.example.backend.security.SecurityConfig.class,
            com.example.backend.security.CustomUserDetailsService.class
        })
    }
)
@AutoConfigureMockMvc(addFilters = true)
@Import({TestSecurityConfig.class}) // 기존 설정 재사용
@EnableMethodSecurity(prePostEnabled = true)
@DisplayName("AdminController 테스트")
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminQueryService adminQueryService;

    @Test
    @DisplayName("ADMIN 역할 없이 접근 시 403 Forbidden 응답")
    @WithMockUser(roles = "USER")
    void shouldReturnForbiddenWhenUserIsNotAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("인증 없이 접근 시 401 Unauthorized 응답")
    void shouldReturnUnauthorizedWhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/admin/stats - 대시보드 통계 조회")
    @WithMockUser(roles = "ADMIN")
    void getAdminStats() throws Exception {
        // given
        AdminStats stats = AdminStats.builder().totalUsers(100).totalPosts(200).build();
        given(adminQueryService.getAdminStats()).willReturn(stats);

        // when & then
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json;charset=UTF-8"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").value(100))
                .andExpect(jsonPath("$.data.totalPosts").value(200));
    }

    @Test
    @DisplayName("GET /api/admin/users - 사용자 목록 조회")
    @WithMockUser(roles = "ADMIN")
    void getUsers() throws Exception {
        // given
        AdminUserRow userRow = AdminUserRow.builder().id(1L).nickname("testuser").email("test@test.com").build();
        Page<AdminUserRow> page = new PageImpl<>(List.of(userRow));
        given(adminQueryService.findUsers(any(AdminUserSearchRequest.class), any(Pageable.class))).willReturn(page);

        // when & then
        mockMvc.perform(get("/api/admin/users")
                        .param("page", "0")
                        .param("size", "20")
                        .param("q", "test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].nickname").value("testuser"));
    }

    @Test
    @DisplayName("GET /api/admin/users/{id} - 사용자 상세 조회")
    @WithMockUser(roles = "ADMIN")
    void getUser() throws Exception {
        // given
        AdminUserDetail userDetail = AdminUserDetail.builder().id(1L).nickname("testuser").email("test@test.com").build();
        given(adminQueryService.getUserDetail(1L)).willReturn(userDetail);

        // when & then
        mockMvc.perform(get("/api/admin/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.nickname").value("testuser"));
    }
    
    @Test
    @DisplayName("GET /api/admin/metrics/range - 기간별 지표 조회")
    @WithMockUser(roles = "ADMIN")
    void getMetricsRange() throws Exception {
        // given
        LocalDate start = LocalDate.of(2023, 1, 1);
        LocalDate end = LocalDate.of(2023, 1, 31);
        DailyMetricPoint point = DailyMetricPoint.builder().date(start).chatCount(10).visitCount(100).build();
        given(adminQueryService.getDailyRange(start, end)).willReturn(Collections.singletonList(point));

        // when & then
        mockMvc.perform(get("/api/admin/metrics/range")
                        .param("start", "2023-01-01")
                        .param("end", "2023-01-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].chatCount").value(10))
                .andExpect(jsonPath("$.data[0].visitCount").value(100));
    }

    // POSTS 목록 조회
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("GET /api/admin/posts → 200 + 페이지 콘텐츠")
    void getPosts_ok() throws Exception {
        var row = com.example.backend.dto.admin.AdminPostRow.builder().id(10L).title("T").authorNickname("A").visibility("public").build();
        Page<AdminPostRow> page = new PageImpl<>(List.of(row), org.springframework.data.domain.PageRequest.of(0,20), 1);
        given(adminQueryService.findPosts(any(), any(Pageable.class))).willReturn(page);

        mockMvc.perform(get("/api/admin/posts").param("page","0").param("size","20"))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(org.springframework.http.MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.content", org.hamcrest.Matchers.hasSize(1)));
    } // Page 직렬화 안전 + 호환 단정 [2][1]

    // POST 상세 404
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("GET /api/admin/posts/{id} (미존재) → 404")
    void getPost_notFound() throws Exception {
        willThrow(new com.example.backend.common.error.NotFoundException("not found"))
            .given(adminQueryService).getPostDetail(999L);
        mockMvc.perform(get("/api/admin/posts/999"))
            .andExpect(status().isNotFound())
            .andExpect(content().contentTypeCompatibleWith(MediaType.valueOf("application/problem+json")));
    } // 운영 PDAdvice 404 경로 [1]

    // 공개 상태 변경 200
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("PATCH /api/admin/posts/{id}/visibility (유효) → 200")
    void updateVisibility_ok() throws Exception {
        mockMvc.perform(patch("/api/admin/posts/1/visibility")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content("{\"visibility\":\"public\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
        then(adminQueryService).should().updatePostVisibility(1L, "public");
    } // DTO 유효 성공 [1]

    // 공개 상태 변경 422 (검증 실패)
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("PATCH /api/admin/posts/{id}/visibility (검증 실패) → 422")
    void updateVisibility_422() throws Exception {
        // visibility가 빈문자 등 검증 실패를 유도
        mockMvc.perform(patch("/api/admin/posts/1/visibility")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content("{\"visibility\":\"\"}"))
            .andExpect(status().isUnprocessableEntity());
    } // Bean Validation 실패는 422 정책 [1]

    // 공개 상태 변경 400 (형식 오류)
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("PATCH /api/admin/posts/{id}/visibility (Malformed JSON) → 400")
    void updateVisibility_malformed_400() throws Exception {
        mockMvc.perform(patch("/api/admin/posts/1/visibility")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content(String.format("{\"visibility\":\"public\""))) // } 누락
            .andExpect(status().isBadRequest());
    } // 역직렬화 실패 400 [5]

    // 게시글 삭제 200 + 이유 옵셔널
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("DELETE /api/admin/posts/{id}?reason=... → 200")
    void deletePost_ok() throws Exception {
        mockMvc.perform(delete("/api/admin/posts/5").param("reason","spam"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
        then(adminQueryService).should().deletePost(5L, "spam");
    } // 정상 흐름 [1]

    // 게시글 삭제 404
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("DELETE /api/admin/posts/{id} (미존재) → 404")
    void deletePost_404() throws Exception {
        willThrow(new com.example.backend.common.error.NotFoundException("not found"))
            .given(adminQueryService).deletePost(7L, null);
        mockMvc.perform(delete("/api/admin/posts/7"))
            .andExpect(status().isNotFound());
    } // PDAdvice 404 [1]

    // 오늘 지표 200
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("GET /api/admin/metrics/today → 200")
    void metrics_today_ok() throws Exception {
        var point = com.example.backend.dto.admin.DailyMetricPoint.builder()
            .date(java.time.LocalDate.now()).chatCount(3).visitCount(30).build();
        given(adminQueryService.getTodayMetrics()).willReturn(point);
        mockMvc.perform(get("/api/admin/metrics/today"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.chatCount").value(3));
    } // 정상 [1]

    // 기간 지표 400 (도메인 검증: start > end)
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("GET /api/admin/metrics/range (start>end) → 400")
    void metrics_range_invalid_400() throws Exception {
        willThrow(new IllegalArgumentException("invalid range"))
            .given(adminQueryService).getDailyRange(LocalDate.parse("2023-02-01"), LocalDate.parse("2023-01-01"));
        mockMvc.perform(get("/api/admin/metrics/range").param("start","2023-02-01").param("end","2023-01-01"))
            .andExpect(status().isBadRequest());
    } // PDAdvice가 IAE→400 매핑 [1]

    // 주간 지표 400 (경계값 하회)
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("GET /api/admin/metrics/weekly?weeks=0 → 400")
    void metrics_weekly_min_400() throws Exception {
        mockMvc.perform(get("/api/admin/metrics/weekly").param("weeks","0"))
            .andExpect(status().isBadRequest());
    } // @Min(1) 위반 [1]

    // 주간 지표 400 (경계값 초과)
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("GET /api/admin/metrics/weekly?weeks=53 → 400")
    void metrics_weekly_max_400() throws Exception {
        mockMvc.perform(get("/api/admin/metrics/weekly").param("weeks","53"))
            .andExpect(status().isBadRequest());
    } // @Max(52) 위반 [1]

    // 사용자 목록 200 + Pageable 바인딩
    @WithMockUser(roles = "ADMIN")
    @Test
    @DisplayName("GET /api/admin/users(page,size,sort) → 200 + 기본 페이징")
    void getUsers_pageable_ok() throws Exception {
        var row = AdminUserRow.builder().id(2L).nickname("u2").email("u2@test.com").build();
        Page<AdminUserRow> page = new PageImpl<>(List.of(row),
            org.springframework.data.domain.PageRequest.of(1,10, org.springframework.data.domain.Sort.by("id").descending()), 11);
        given(adminQueryService.findUsers(any(AdminUserSearchRequest.class), any(Pageable.class))).willReturn(page);

        mockMvc.perform(get("/api/admin/users")
                .param("page","1").param("size","10").param("sort","id,desc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content").isArray());
    } // PageImpl + Pageable 명시 [2]
}
