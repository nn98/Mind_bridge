package com.example.backend.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.backend.common.error.BadRequestException;
import com.example.backend.common.error.ForbiddenException;
import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.post.CreateRequest;
import com.example.backend.dto.post.Detail;
import com.example.backend.dto.post.Summary;
import com.example.backend.dto.post.UpdateRequest;
import com.example.backend.entity.PostEntity;
import com.example.backend.entity.UserEntity;
import com.example.backend.mapper.PostMapper;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostService 테스트")
class PostServiceTest {

	@InjectMocks
	private PostService postService;

	@Mock
	private PostRepository postRepository;

	@Mock
	private UserRepository userRepository;

	@Mock  // ✅ PostMapper Mock 추가
	private PostMapper postMapper;

	private UserEntity testUser;
	private UserEntity adminUser;
	private PostEntity testPost;
	private Detail testDetail;
	private Summary testSummary;

	@BeforeEach
	void setUp() {
		testUser = UserEntity.builder()
			.userId(1L)
			.email("user@example.com")
			.nickname("테스트사용자")
			.fullName("테스트 사용자")
			.role("USER")
			.build();

		adminUser = UserEntity.builder()
			.userId(2L)
			.email("admin@example.com")
			.nickname("관리자")
			.fullName("관리자")
			.role("ADMIN")
			.build();

		testPost = PostEntity.builder()
			.postId(1L)
			.title("테스트 게시글")
			.content("테스트 내용입니다.")
			.userId(1L)
			.visibility("public")
			.status("active")
			.likeCount(10)
			.commentCount(5)
			.viewCount(100)
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();

		testDetail = new Detail();
		testDetail.setId(1L);
		testDetail.setTitle("테스트 게시글");
		testDetail.setContent("테스트 내용입니다.");
		testDetail.setUserEmail("user@example.com");
		testDetail.setUserNickname("테스트사용자");
		testDetail.setVisibility("public");
		testDetail.setLikeCount(10);
		testDetail.setCommentCount(5);
		testDetail.setCreatedAt(LocalDateTime.now());
		testDetail.setUpdatedAt(LocalDateTime.now());

		testSummary = new Summary();
		testSummary.setId(1L);
		testSummary.setContentPreview("테스트 내용입니다.");
		testSummary.setUserNickname("테스트사용자");
		testSummary.setVisibility("public");
		testSummary.setLikeCount(10);
		testSummary.setCommentCount(5);
		testSummary.setCreatedAt(LocalDateTime.now());
	}

	@Nested
	@DisplayName("게시글 생성")
	class CreatePostTest {

		@Test
		@DisplayName("정상적인 게시글 생성")
		void createPost() {
			// given
			CreateRequest request = CreateRequest.builder()
				.title("새 게시글")
				.content("새로운 내용")
				.visibility("public")
				.build();

			given(userRepository.findByEmail("user@example.com"))
				.willReturn(Optional.of(testUser));

			// ✅ PostMapper Mock 설정
			given(postMapper.toEntity(request, testUser))
				.willReturn(testPost);

			given(postRepository.save(testPost))
				.willReturn(testPost);

			// ✅ PostMapper Mock 설정
			given(postMapper.toDetail(testPost, userRepository))
				.willReturn(testDetail);

			// when
			Detail result = postService.createPost(request, "user@example.com");

			// then
			assertThat(result).isNotNull();
			assertThat(result.getUserEmail()).isEqualTo("user@example.com");
			assertThat(result.getUserNickname()).isEqualTo("테스트사용자");

			verify(postMapper).toEntity(request, testUser);
			verify(postMapper).toDetail(testPost, userRepository);
		}

		@Test
		@DisplayName("사용자없음_NotFoundException")
		void createPost_사용자없음_NotFoundException() {
			// given
			CreateRequest request = CreateRequest.builder()
				.title("새 게시글")
				.content("새로운 내용")
				.build();

			given(userRepository.findByEmail("nonexistent@example.com"))
				.willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> postService.createPost(request, "nonexistent@example.com"))
				.isInstanceOf(NotFoundException.class)
				.hasMessage("사용자를 찾을 수 없습니다.");
		}
	}

	@Nested
	@DisplayName("게시글 조회")
	class ReadPostTest {

		@Test
		@DisplayName("사용자별 게시글 조회 성공")
		void getPostsByUser_성공() {
			// given
			given(userRepository.findByEmail("user@example.com"))
				.willReturn(Optional.of(testUser));
			given(postRepository.findByUserIdOrderByCreatedAtDesc(1L))
				.willReturn(List.of(testPost));

			// ✅ PostMapper Mock 설정
			given(postMapper.toDetailList(List.of(testPost), userRepository))
				.willReturn(List.of(testDetail));

			// when
			List<Detail> result = postService.getPostsByUser("user@example.com");

			// then
			assertThat(result).hasSize(1);
			Detail detail = result.get(0);
			assertThat(detail.getUserEmail()).isEqualTo("user@example.com");
			assertThat(detail.getUserNickname()).isEqualTo("테스트사용자");

			verify(postMapper).toDetailList(List.of(testPost), userRepository);
		}

		@Test
		@DisplayName("전체 게시글 조회 성공")
		void getAllPosts_성공() {
			// given
			given(postRepository.findAllByOrderByCreatedAtDesc())
				.willReturn(List.of(testPost));

			// ✅ PostMapper Mock 설정
			given(postMapper.toDetailList(List.of(testPost), userRepository))
				.willReturn(List.of(testDetail));

			// when
			List<Detail> result = postService.getAllPosts();

			// then
			assertThat(result).hasSize(1);
			Detail detail = result.get(0);
			assertThat(detail.getUserEmail()).isEqualTo("user@example.com");

			verify(postMapper).toDetailList(List.of(testPost), userRepository);
		}

		@Test
		@DisplayName("공개 게시글 조회 성공")
		void getPublicPosts_성공() {
			// given
			given(postRepository.findByVisibilityOrderByCreatedAtDesc("public"))
				.willReturn(List.of(testPost));

			// ✅ PostMapper Mock 설정
			given(postMapper.toSummaryList(List.of(testPost), userRepository))
				.willReturn(List.of(testSummary));

			// when
			List<Summary> result = postService.getPublicPosts();

			// then
			assertThat(result).hasSize(1);
			Summary summary = result.get(0);
			assertThat(summary.getUserNickname()).isEqualTo("테스트사용자");

			verify(postMapper).toSummaryList(List.of(testPost), userRepository);
		}

		@Test
		@DisplayName("게시글 상세 조회 성공")
		void getPostDetail_성공() {
			// given
			given(postRepository.findById(1L))
				.willReturn(Optional.of(testPost));

			// ✅ PostMapper Mock 설정
			given(postMapper.toDetail(testPost, userRepository))
				.willReturn(testDetail);

			// when
			Optional<Detail> result = postService.getPostDetail(1L);

			// then
			assertThat(result).isPresent();
			Detail detail = result.get();
			assertThat(detail.getUserEmail()).isEqualTo("user@example.com");

			verify(postMapper).toDetail(testPost, userRepository);
		}
	}

	@Nested
	@DisplayName("게시글 수정")
	class UpdatePostTest {

		@Test
		@DisplayName("부분수정 성공")
		void updatePost_부분수정_성공() {
			// given
			UpdateRequest request = UpdateRequest.builder()
				.content("수정된 내용")
				.build();

			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));
			given(userRepository.findByEmail("user@example.com"))
				.willReturn(Optional.of(testUser));
			given(postRepository.save(testPost)).willReturn(testPost);

			// ✅ PostMapper Mock 설정
			given(postMapper.toDetail(testPost, userRepository))
				.willReturn(testDetail);

			// when
			Detail result = postService.updatePost(1L, request, "user@example.com");

			// then
			assertThat(testPost.getContent()).isEqualTo("수정된 내용");
			assertThat(result).isNotNull();

			verify(postMapper).toDetail(testPost, userRepository);
		}

		@Test
		@DisplayName("권한없음_ForbiddenException")
		void updatePost_권한없음_ForbiddenException() {
			// given
			UpdateRequest request = UpdateRequest.builder()
				.content("수정된 내용")
				.build();

			UserEntity otherUser = UserEntity.builder()
				.userId(2L)
				.email("other@example.com")
				.nickname("다른사용자")
				.role("USER")
				.build();

			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));
			given(userRepository.findByEmail("other@example.com"))
				.willReturn(Optional.of(otherUser));

			// when & then
			assertThatThrownBy(() -> postService.updatePost(1L, request, "other@example.com"))
				.isInstanceOf(ForbiddenException.class)
				.hasMessage("게시글 수정 권한이 없습니다.");
		}

		@Test
		@DisplayName("빈내용_BadRequestException")
		void updatePost_빈내용_BadRequestException() {
			// given
			UpdateRequest request = UpdateRequest.builder()
				.content("")
				.build();

			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));
			given(userRepository.findByEmail("user@example.com"))
				.willReturn(Optional.of(testUser));

			// when & then
			assertThatThrownBy(() -> postService.updatePost(1L, request, "user@example.com"))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("게시글 내용은 비워둘 수 없습니다.");
		}
	}

	@Nested
	@DisplayName("게시글 삭제")
	class DeletePostTest {

		@Test
		@DisplayName("삭제 성공")
		void deletePost_성공() {
			// given
			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));
			given(userRepository.findByEmail("user@example.com"))
				.willReturn(Optional.of(testUser));

			// when
			postService.deletePost(1L, "user@example.com");

			// then
			verify(postRepository).deleteById(1L);
		}

		@Test
		@DisplayName("권한없음_ForbiddenException")
		void deletePost_권한없음_ForbiddenException() {
			// given
			UserEntity otherUser = UserEntity.builder()
				.userId(2L)
				.email("other@example.com")
				.nickname("다른사용자")
				.role("USER")
				.build();

			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));
			given(userRepository.findByEmail("other@example.com"))
				.willReturn(Optional.of(otherUser));

			// when & then
			assertThatThrownBy(() -> postService.deletePost(1L, "other@example.com"))
				.isInstanceOf(ForbiddenException.class)
				.hasMessage("게시글 삭제 권한이 없습니다.");
		}
	}

	@Nested
	@DisplayName("유틸리티")
	class UtilityTest {

		@Test
		@DisplayName("게시글 개수 조회 성공")
		void getPostCountByVisibility_성공() {
			// given
			given(userRepository.findByEmail("user@example.com"))
				.willReturn(Optional.of(testUser));
			given(postRepository.countByUserIdAndVisibility(1L, "public"))
				.willReturn(5L);

			// when
			long result = postService.getPostCountByVisibility("user@example.com", "public");

			// then
			assertThat(result).isEqualTo(5L);
		}

		@Test
		@DisplayName("최근 게시글 조회 성공")
		void getRecentPosts_성공() {
			// given
			given(postRepository.findTopNByOrderByCreatedAtDesc(5))
				.willReturn(List.of(testPost));

			// ✅ PostMapper Mock 설정
			given(postMapper.toSummaryList(List.of(testPost), userRepository))
				.willReturn(List.of(testSummary));

			// when
			List<Summary> result = postService.getRecentPosts(5);

			// then
			assertThat(result).hasSize(1);
			Summary summary = result.get(0);
			assertThat(summary.getUserNickname()).isEqualTo("테스트사용자");

			verify(postMapper).toSummaryList(List.of(testPost), userRepository);
		}
	}
}
