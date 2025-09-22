package com.example.backend.service.impl;

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
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostServiceImpl 통합 테스트")
class PostServiceImplTest {

	@InjectMocks
	private PostServiceImpl postService;

	@Mock
	private PostRepository postRepository;

	@Mock
	private UserRepository userRepository;

	private UserEntity testUser;
	private PostEntity testPost;

	@BeforeEach
	void setUp() {
		testUser = UserEntity.builder()
			.userId(1L)
			.email("user@example.com")
			.nickname("테스트사용자")
			.fullName("테스트 사용자")
			.build();

		testPost = PostEntity.builder()
			.postId(1L)
			.title("테스트 포스트")
			.content("테스트 내용입니다.")
			.userEmail("user@example.com")
			.userNickname("테스트사용자")
			.visibility("public")
			.status("active")
			.likeCount(10)
			.commentCount(5)
			.viewCount(100)
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();
	}

	@Nested
	@DisplayName("포스트 생성")
	class CreatePostTest {

		@Test
		@DisplayName("성공 - 제목 있음")
		void createPost_제목있음_성공() {
			// given
			CreateRequest request = CreateRequest.builder()
				.title("새 포스트")
				.content("새로운 포스트 내용")
				.visibility("public")
				.build();

			given(userRepository.findByEmail("user@example.com")).willReturn(Optional.of(testUser));

			ArgumentCaptor<PostEntity> captor = ArgumentCaptor.forClass(PostEntity.class);
			willAnswer(invocation -> {
				PostEntity entity = invocation.getArgument(0);
				entity.setPostId(1L);
				entity.setCreatedAt(LocalDateTime.now());
				entity.setUpdatedAt(LocalDateTime.now());
				return entity;
			}).given(postRepository).save(captor.capture());

			// when
			Detail result = postService.createPost(request, "user@example.com");

			// then
			PostEntity savedEntity = captor.getValue();
			assertThat(savedEntity.getTitle()).isEqualTo("새 포스트");
			assertThat(savedEntity.getContent()).isEqualTo("새로운 포스트 내용");
			assertThat(savedEntity.getUserEmail()).isEqualTo("user@example.com");
			assertThat(savedEntity.getUserNickname()).isEqualTo("테스트사용자");

			assertThat(result).isNotNull();
			assertThat(result.getTitle()).isEqualTo("새 포스트");
			assertThat(result.getContent()).isEqualTo("새로운 포스트 내용");
			assertThat(result.getUserEmail()).isEqualTo("user@example.com");
			assertThat(result.getUserNickname()).isEqualTo("테스트사용자");
			assertThat(result.getVisibility()).isEqualTo("public");
		}

		@Test
		@DisplayName("성공 - 제목 없음 (기본값 설정)")
		void createPost_제목없음_기본값설정() {
			// given
			CreateRequest request = CreateRequest.builder()
				.content("내용만 있는 포스트")
				.visibility("private")
				.build();

			given(userRepository.findByEmail("user@example.com")).willReturn(Optional.of(testUser));

			ArgumentCaptor<PostEntity> captor = ArgumentCaptor.forClass(PostEntity.class);
			willAnswer(invocation -> {
				PostEntity entity = invocation.getArgument(0);
				entity.setPostId(1L);
				entity.setCreatedAt(LocalDateTime.now());
				entity.setUpdatedAt(LocalDateTime.now());
				return entity;
			}).given(postRepository).save(captor.capture());

			// when
			Detail result = postService.createPost(request, "user@example.com");

			// then
			PostEntity savedEntity = captor.getValue();
			assertThat(savedEntity.getTitle()).isEqualTo("제목 없음");

			assertThat(result.getTitle()).isEqualTo("제목 없음");
			assertThat(result.getContent()).isEqualTo("내용만 있는 포스트");
			assertThat(result.getVisibility()).isEqualTo("private");
		}

		@Test
		@DisplayName("실패 - 사용자 없음")
		void createPost_사용자없음_NotFoundException() {
			// given
			CreateRequest request = CreateRequest.builder()
				.content("내용")
				.build();

			given(userRepository.findByEmail("nonexistent@example.com")).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> postService.createPost(request, "nonexistent@example.com"))
				.isInstanceOf(NotFoundException.class)
				.hasMessage("사용자를 찾을 수 없습니다.")
				.extracting("code").isEqualTo("USER_NOT_FOUND");
		}

		@Test
		@DisplayName("실패 - 내용 없음")
		void createPost_내용없음_BadRequestException() {
			// given
			CreateRequest request = CreateRequest.builder()
				.title("제목")
				.content("")
				.build();

			// when & then
			assertThatThrownBy(() -> postService.createPost(request, "user@example.com"))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("게시글 내용은 필수입니다.")
				.extracting("code").isEqualTo("MISSING_CONTENT");
		}

		@Test
		@DisplayName("실패 - null 요청")
		void createPost_null요청_BadRequestException() {
			// when & then
			assertThatThrownBy(() -> postService.createPost(null, "user@example.com"))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("게시글 내용은 필수입니다.");
		}
	}

	@Nested
	@DisplayName("포스트 수정")
	class UpdatePostTest {

		@Test
		@DisplayName("성공 - 부분 수정")
		void updatePost_부분수정_성공() {
			// given
			UpdateRequest request = UpdateRequest.builder()
				.content("수정된 내용")
				.visibility("private")
				.build();

			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));
			given(postRepository.save(testPost)).willReturn(testPost);

			// when
			Detail result = postService.updatePost(1L, request, "user@example.com");

			// then
			assertThat(testPost.getContent()).isEqualTo("수정된 내용");
			assertThat(testPost.getVisibility()).isEqualTo("private");

			assertThat(result).isNotNull();
			assertThat(result.getContent()).isEqualTo("수정된 내용");
			assertThat(result.getVisibility()).isEqualTo("private");
			verify(postRepository).save(testPost);
		}

		@Test
		@DisplayName("실패 - 권한 없음")
		void updatePost_권한없음_ForbiddenException() {
			// given
			UpdateRequest request = UpdateRequest.builder()
				.content("수정된 내용")
				.build();

			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));

			// when & then
			assertThatThrownBy(() -> postService.updatePost(1L, request, "other@example.com"))
				.isInstanceOf(ForbiddenException.class)
				.hasMessage("게시글 수정 권한이 없습니다.")
				.extracting("code").isEqualTo("FORBIDDEN_POST_수정");
		}

		@Test
		@DisplayName("실패 - 포스트 없음")
		void updatePost_포스트없음_NotFoundException() {
			// given
			UpdateRequest request = UpdateRequest.builder()
				.content("수정된 내용")
				.build();

			given(postRepository.findById(999L)).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> postService.updatePost(999L, request, "user@example.com"))
				.isInstanceOf(NotFoundException.class)
				.hasMessage("게시글을 찾을 수 없습니다.");
		}

		@Test
		@DisplayName("실패 - 빈 내용으로 수정")
		void updatePost_빈내용_BadRequestException() {
			// given
			UpdateRequest request = UpdateRequest.builder()
				.content("   ")
				.build();

			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));

			// when & then
			assertThatThrownBy(() -> postService.updatePost(1L, request, "user@example.com"))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("게시글 내용은 비워둘 수 없습니다.");
		}

		@Test
		@DisplayName("실패 - 잘못된 포스트 ID")
		void updatePost_잘못된ID_BadRequestException() {
			// given
			UpdateRequest request = UpdateRequest.builder()
				.content("내용")
				.build();

			// when & then
			assertThatThrownBy(() -> postService.updatePost(0L, request, "user@example.com"))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("유효하지 않은 게시글 ID입니다.");
		}
	}

	@Nested
	@DisplayName("포스트 삭제")
	class DeletePostTest {

		@Test
		@DisplayName("성공")
		void deletePost_성공() {
			// given
			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));

			// when
			postService.deletePost(1L, "user@example.com");

			// then
			verify(postRepository).deleteById(1L);
		}

		@Test
		@DisplayName("실패 - 권한 없음")
		void deletePost_권한없음_ForbiddenException() {
			// given
			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));

			// when & then
			assertThatThrownBy(() -> postService.deletePost(1L, "other@example.com"))
				.isInstanceOf(ForbiddenException.class)
				.hasMessage("게시글 삭제 권한이 없습니다.");
		}
	}

	@Nested
	@DisplayName("포스트 조회")
	class ReadPostTest {

		@Test
		@DisplayName("전체 포스트 조회 성공")
		void getAllPosts_성공() {
			// given
			given(postRepository.findAllByOrderByCreatedAtDesc()).willReturn(List.of(testPost));

			// when
			List<Detail> result = postService.getAllPosts();

			// then
			assertThat(result).hasSize(1);
			Detail detail = result.get(0);
			assertThat(detail.getId()).isEqualTo(1L);
			assertThat(detail.getTitle()).isEqualTo("테스트 포스트");
			assertThat(detail.getUserEmail()).isEqualTo("user@example.com");
			assertThat(detail.getUserNickname()).isEqualTo("테스트사용자");
			assertThat(detail.getLikeCount()).isEqualTo(10);
			assertThat(detail.getCommentCount()).isEqualTo(5);
		}

		@Test
		@DisplayName("공개 포스트 조회 성공")
		void getPublicPosts_성공() {
			// given
			given(postRepository.findByVisibilityOrderByCreatedAtDesc("public"))
				.willReturn(List.of(testPost));

			// when
			List<Summary> result = postService.getPublicPosts();

			// then
			assertThat(result).hasSize(1);
			Summary summary = result.get(0);
			assertThat(summary.getId()).isEqualTo(1L);
			assertThat(summary.getUserNickname()).isEqualTo("테스트사용자");
			assertThat(summary.getVisibility()).isEqualTo("public");
			assertThat(summary.getLikeCount()).isEqualTo(10);
		}

		@Test
		@DisplayName("사용자별 포스트 조회 성공")
		void getPostsByUser_성공() {
			// given
			given(postRepository.findByUserEmailOrderByCreatedAtDesc("user@example.com"))
				.willReturn(List.of(testPost));

			// when
			List<Detail> result = postService.getPostsByUser("user@example.com");

			// then
			assertThat(result).hasSize(1);
			Detail detail = result.get(0);
			assertThat(detail.getUserEmail()).isEqualTo("user@example.com");
			assertThat(detail.getUserNickname()).isEqualTo("테스트사용자");
		}

		@Test
		@DisplayName("포스트 상세 조회 성공")
		void getPostDetail_성공() {
			// given
			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));

			// when
			Optional<Detail> result = postService.getPostDetail(1L);

			// then
			assertThat(result).isPresent();
			Detail detail = result.get();
			assertThat(detail.getId()).isEqualTo(1L);
			assertThat(detail.getTitle()).isEqualTo("테스트 포스트");
			assertThat(detail.getContent()).isEqualTo("테스트 내용입니다.");
			assertThat(detail.getUserEmail()).isEqualTo("user@example.com");
			assertThat(detail.getUserNickname()).isEqualTo("테스트사용자");
		}

		@Test
		@DisplayName("포스트 상세 조회 - 존재하지 않음")
		void getPostDetail_없음() {
			// given
			given(postRepository.findById(999L)).willReturn(Optional.empty());

			// when
			Optional<Detail> result = postService.getPostDetail(999L);

			// then
			assertThat(result).isEmpty();
		}
	}

	@Nested
	@DisplayName("유틸리티 메서드")
	class UtilityTest {

		@Test
		@DisplayName("가시성별 포스트 수 조회")
		void getPostCountByVisibility_성공() {
			// given
			given(postRepository.countByUserEmailAndVisibility("user@example.com", "public"))
				.willReturn(5L);

			// when
			long result = postService.getPostCountByVisibility("user@example.com", "public");

			// then
			assertThat(result).isEqualTo(5L);
		}

		@Test
		@DisplayName("최근 포스트 조회")
		void getRecentPosts_성공() {
			// given
			given(postRepository.findTopNByOrderByCreatedAtDesc(10))
				.willReturn(List.of(testPost));

			// when
			List<Summary> result = postService.getRecentPosts(10);

			// then
			assertThat(result).hasSize(1);
			Summary summary = result.get(0);
			assertThat(summary.getId()).isEqualTo(1L);
			assertThat(summary.getUserNickname()).isEqualTo("테스트사용자");
		}

		@Test
		@DisplayName("최근 포스트 조회 - 잘못된 limit")
		void getRecentPosts_잘못된limit_BadRequestException() {
			// when & then
			assertThatThrownBy(() -> postService.getRecentPosts(0))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("조회 개수는 1~100 사이여야 합니다.");

			assertThatThrownBy(() -> postService.getRecentPosts(101))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("조회 개수는 1~100 사이여야 합니다.");
		}

		@Test
		@DisplayName("사용자별 포스트 조회 - 빈 이메일")
		void getPostsByUser_빈이메일_BadRequestException() {
			// when & then
			assertThatThrownBy(() -> postService.getPostsByUser(""))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("사용자 이메일은 필수입니다.");

			assertThatThrownBy(() -> postService.getPostsByUser(null))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("사용자 이메일은 필수입니다.");
		}
	}

	@Nested
	@DisplayName("내부 로직 검증")
	class InternalLogicTest {

		@Test
		@DisplayName("내용 요약 기능")
		void truncateContent_테스트() {
			// given
			String longContent = "a".repeat(150);
			PostEntity longPost = PostEntity.builder()
				.postId(1L)
				.content(longContent)
				.userNickname("사용자")
				.visibility("public")
				.likeCount(0)
				.commentCount(0)
				.createdAt(LocalDateTime.now())
				.build();

			given(postRepository.findByVisibilityOrderByCreatedAtDesc("public"))
				.willReturn(List.of(longPost));

			// when
			List<Summary> result = postService.getPublicPosts();

			// then
			assertThat(result).hasSize(1);
			Summary summary = result.get(0);
			assertThat(summary.getContentPreview()).hasSize(103); // 100 + "..."
			assertThat(summary.getContentPreview()).endsWith("...");
		}

		@Test
		@DisplayName("제목 정규화 테스트")
		void normalizeTitle_테스트() {
			// given
			CreateRequest requestWithSpaces = CreateRequest.builder()
				.title("  제목 공백  ")
				.content("내용")
				.build();

			given(userRepository.findByEmail("user@example.com")).willReturn(Optional.of(testUser));

			ArgumentCaptor<PostEntity> captor = ArgumentCaptor.forClass(PostEntity.class);
			willAnswer(invocation -> {
				PostEntity entity = invocation.getArgument(0);
				entity.setPostId(1L);
				entity.setCreatedAt(LocalDateTime.now());
				entity.setUpdatedAt(LocalDateTime.now());
				return entity;
			}).given(postRepository).save(captor.capture());

			// when
			Detail result = postService.createPost(requestWithSpaces, "user@example.com");

			// then
			PostEntity savedEntity = captor.getValue();
			assertThat(savedEntity.getTitle()).isEqualTo("제목 공백");
			assertThat(result.getTitle()).isEqualTo("제목 공백");
		}
	}
}
