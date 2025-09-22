package com.example.backend.service.impl;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.admin.AdminPostDetail;
import com.example.backend.dto.admin.AdminPostRow;
import com.example.backend.dto.admin.AdminPostSearchRequest;
import com.example.backend.dto.admin.AdminStats;
import com.example.backend.dto.admin.AdminUserDetail;
import com.example.backend.dto.admin.AdminUserRow;
import com.example.backend.dto.admin.AdminUserSearchRequest;
import com.example.backend.dto.admin.DailyMetricPoint;
import com.example.backend.entity.DailyMetricsEntity;
import com.example.backend.entity.PostEntity;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.DailyMetricsRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;

/**
 * AdminQueryServiceImpl 테스트 - user 필드 통일 반영
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminQueryServiceImpl 테스트")
class AdminQueryServiceImplTest {

	@InjectMocks
	private AdminQueryServiceImpl adminQueryService;

	@Mock
	private UserRepository userRepository;

	@Mock
	private PostRepository postRepository;

	@Mock
	private DailyMetricsRepository dailyMetricsRepository;

	private UserEntity testUser;
	private PostEntity testPost;
	private DailyMetricsEntity testMetrics;

	@BeforeEach
	void setUp() {
		testUser = UserEntity.builder()
			.userId(1L)
			.email("admin@example.com")
			.nickname("관리자")
			.fullName("관리자")
			.role("ADMIN")
			.age(30)
			.gender("male")
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();

		// ✅ author 대신 userEmail, userNickname 사용
		testPost = PostEntity.builder()
			.postId(1L)
			.title("테스트 포스트")
			.content("테스트 내용")
			.userEmail("user@example.com")  // ← userEmail 직접 설정
			.userNickname("사용자닉네임")     // ← userNickname 직접 설정
			.visibility("public")
			.likeCount(10)
			.commentCount(5)
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();

		testMetrics = DailyMetricsEntity.builder()
			.statDate(LocalDate.now())
			.loginCount(100)
			.chatCount(50)
			.build();
	}

	// === 관리자 통계 테스트 ===

	@Test
	@DisplayName("관리자 통계 조회 성공")
	void getAdminStats_성공() {
		// given
		given(userRepository.count()).willReturn(1000L);
		given(postRepository.count()).willReturn(500L);
		given(dailyMetricsRepository.findById(any(LocalDate.class)))
			.willReturn(Optional.of(testMetrics));
		given(dailyMetricsRepository.findAllByStatDateBetween(any(LocalDate.class), any(LocalDate.class)))
			.willReturn(List.of(testMetrics));

		// when
		AdminStats result = adminQueryService.getAdminStats();

		// then
		assertThat(result.getTotalUsers()).isEqualTo(1000L);
		assertThat(result.getTotalPosts()).isEqualTo(500L);
		assertThat(result.getTodayChats()).isEqualTo(50L);
		assertThat(result.getTodayVisits()).isEqualTo(100L);
	}

	// === 사용자 관리 테스트 ===

	@Test
	@DisplayName("사용자 목록 조회 성공")
	void findUsers_성공() {
		// given
		AdminUserSearchRequest request = AdminUserSearchRequest.builder()
			.q("관리자")
			.role("ADMIN")
			.build();

		Page<UserEntity> userPage = new PageImpl<>(List.of(testUser));
		given(userRepository.findAll(any(Specification.class), any(Pageable.class)))
			.willReturn(userPage);

		// when
		Page<AdminUserRow> result = adminQueryService.findUsers(request, PageRequest.of(0, 20));

		// then
		assertThat(result.getContent()).hasSize(1);
		AdminUserRow userRow = result.getContent().get(0);
		assertThat(userRow.getId()).isEqualTo(1L);
		assertThat(userRow.getNickname()).isEqualTo("관리자");
		assertThat(userRow.getEmail()).isEqualTo("admin@example.com");
		assertThat(userRow.getRole()).isEqualTo("ADMIN");
	}

	@Test
	@DisplayName("사용자 상세 조회 성공")
	void getUserDetail_성공() {
		// given
		given(userRepository.findById(1L)).willReturn(Optional.of(testUser));

		// when
		AdminUserDetail result = adminQueryService.getUserDetail(1L);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getId()).isEqualTo(1L);
		assertThat(result.getNickname()).isEqualTo("관리자");
		assertThat(result.getEmail()).isEqualTo("admin@example.com");
		assertThat(result.getRole()).isEqualTo("ADMIN");
	}

	@Test
	@DisplayName("사용자 상세 조회 - 존재하지 않는 사용자")
	void getUserDetail_사용자없음_NotFoundException() {
		// given
		given(userRepository.findById(999L)).willReturn(Optional.empty());

		// when & then
		assertThatThrownBy(() -> adminQueryService.getUserDetail(999L))
			.isInstanceOf(NotFoundException.class)
			.hasMessage("User not found");
	}

	// === 포스트 관리 테스트 ===

	@Test
	@DisplayName("포스트 목록 조회 성공")
	void findPosts_성공() {
		// given
		AdminPostSearchRequest request = AdminPostSearchRequest.builder()
			.q("테스트")
			.visibility("public")
			.build();

		Page<PostEntity> postPage = new PageImpl<>(List.of(testPost));
		given(postRepository.findAll(any(Specification.class), any(Pageable.class)))
			.willReturn(postPage);

		// when
		Page<AdminPostRow> result = adminQueryService.findPosts(request, PageRequest.of(0, 20));

		// then
		assertThat(result.getContent()).hasSize(1);
		AdminPostRow postRow = result.getContent().get(0);
		assertThat(postRow.getId()).isEqualTo(1L);
		assertThat(postRow.getTitle()).isEqualTo("테스트 포스트");
		// ✅ userEmail, userNickname 직접 접근 (N+1 해결)
		assertThat(postRow.getUserEmail()).isEqualTo("user@example.com");
		assertThat(postRow.getUserNickname()).isEqualTo("사용자닉네임");
		assertThat(postRow.getVisibility()).isEqualTo("public");
		assertThat(postRow.getLikeCount()).isEqualTo(10);
	}

	@Test
	@DisplayName("포스트 상세 조회 성공")
	void getPostDetail_성공() {
		// given
		given(postRepository.findById(1L)).willReturn(Optional.of(testPost));

		// when
		AdminPostDetail result = adminQueryService.getPostDetail(1L);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getId()).isEqualTo(1L);
		assertThat(result.getTitle()).isEqualTo("테스트 포스트");
		assertThat(result.getContent()).isEqualTo("테스트 내용");
		// ✅ N+1 해결된 직접 필드 접근
		assertThat(result.getUserEmail()).isEqualTo("user@example.com");
		assertThat(result.getUserNickname()).isEqualTo("사용자닉네임");
	}

	@Test
	@DisplayName("포스트 가시성 업데이트 성공")
	void updatePostVisibility_성공() {
		// given
		given(postRepository.findById(1L)).willReturn(Optional.of(testPost));

		// when
		adminQueryService.updatePostVisibility(1L, "private");

		// then
		assertThat(testPost.getVisibility()).isEqualTo("private");
		verify(postRepository).save(testPost);
	}

	@Test
	@DisplayName("포스트 삭제 성공")
	void deletePost_성공() {
		// when
		adminQueryService.deletePost(1L, "스팸");

		// then
		verify(postRepository).deleteById(1L);
	}

	// === 메트릭 테스트 ===

	@Test
	@DisplayName("오늘 메트릭 조회 성공")
	void getTodayMetrics_성공() {
		// given
		LocalDate today = LocalDate.now();
		given(dailyMetricsRepository.findById(today)).willReturn(Optional.of(testMetrics));

		// when
		DailyMetricPoint result = adminQueryService.getTodayMetrics();

		// then
		assertThat(result).isNotNull();
		assertThat(result.getDate()).isEqualTo(today);
		assertThat(result.getChatCount()).isEqualTo(50);
		assertThat(result.getVisitCount()).isEqualTo(100);
	}

	@Test
	@DisplayName("일별 범위 메트릭 조회 성공")
	void getDailyRange_성공() {
		// given
		LocalDate start = LocalDate.now().minusDays(7);
		LocalDate end = LocalDate.now();
		given(dailyMetricsRepository.findAllByStatDateBetween(start, end))
			.willReturn(List.of(testMetrics));

		// when
		List<DailyMetricPoint> result = adminQueryService.getDailyRange(start, end);

		// then
		assertThat(result).hasSize(1);
		DailyMetricPoint point = result.get(0);
		assertThat(point.getChatCount()).isEqualTo(50);
		assertThat(point.getVisitCount()).isEqualTo(100);
	}

	@Test
	@DisplayName("오늘 메트릭 조회 - 데이터 없음")
	void getTodayMetrics_데이터없음() {
		// given
		given(dailyMetricsRepository.findById(any(LocalDate.class))).willReturn(Optional.empty());

		// when
		DailyMetricPoint result = adminQueryService.getTodayMetrics();

		// then
		assertThat(result).isNotNull();
		assertThat(result.getChatCount()).isEqualTo(0);
		assertThat(result.getVisitCount()).isEqualTo(0);
	}
}
