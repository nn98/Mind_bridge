package com.example.backend.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

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
}
