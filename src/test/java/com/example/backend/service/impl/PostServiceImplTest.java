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

import com.example.backend.dto.post.CreateRequest;
import com.example.backend.dto.post.Detail;
import com.example.backend.dto.post.UpdateRequest;
import com.example.backend.entity.PostEntity;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.PostService;

@ExtendWith(MockitoExtension.class)
@DisplayName("PostService 테스트")  // ✅ Impl 제거
class PostServiceTest {  // ✅ 클래스명도 변경

	@InjectMocks
	private PostService postService;  // ✅ PostServiceImpl → PostService

	@Mock
	private PostRepository postRepository;

	@Mock
	private UserRepository userRepository;  // ✅ UserRepository 추가

	private UserEntity testUser;
	private PostEntity testPost;

	@BeforeEach
	void setUp() {
		testUser = UserEntity.builder()
			.userId(1L)  // ✅ userId 추가
			.email("user@example.com")
			.nickname("테스트사용자")
			.fullName("테스트 사용자")
			.build();

		testPost = PostEntity.builder()
			.postId(1L)
			.title("테스트 게시글")
			.content("테스트 내용입니다.")
			.userId(1L)  // ✅ userId 사용 (userEmail, userNickname 제거)
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
				.willReturn(Optional.of(testUser));  // ✅ 사용자 조회 Mock

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
			assertThat(savedEntity.getTitle()).isEqualTo("새 게시글");
			assertThat(savedEntity.getContent()).isEqualTo("새로운 내용");
			assertThat(savedEntity.getUserId()).isEqualTo(1L);  // ✅ userId 확인

			assertThat(result.getTitle()).isEqualTo("새 게시글");
			assertThat(result.getContent()).isEqualTo("새로운 내용");
			assertThat(result.getUserEmail()).isEqualTo("user@example.com");  // ✅ JOIN으로 조회된 값
			assertThat(result.getUserNickname()).isEqualTo("테스트사용자");  // ✅ JOIN으로 조회된 값
		}
	}

	@Nested
	@DisplayName("게시글 조회")
	class ReadPostTest {

		@Test
		@DisplayName("사용자별 게시글 조회")
		void getPostsByUser() {
			// given
			given(userRepository.findByEmail("user@example.com"))
				.willReturn(Optional.of(testUser));  // ✅ 사용자 조회 먼저
			given(postRepository.findByUserIdOrderByCreatedAtDesc(1L))  // ✅ userId로 변경
				.willReturn(List.of(testPost));
			given(userRepository.findById(1L))  // ✅ JOIN용 Mock 추가
				.willReturn(Optional.of(testUser));

			// when
			List<Detail> result = postService.getPostsByUser("user@example.com");

			// then
			assertThat(result).hasSize(1);
			Detail detail = result.get(0);
			assertThat(detail.getUserEmail()).isEqualTo("user@example.com");
			assertThat(detail.getUserNickname()).isEqualTo("테스트사용자");
		}

		@Test
		@DisplayName("게시글 개수 조회")
		void getPostCountByVisibility() {
			// given
			given(userRepository.findByEmail("user@example.com"))
				.willReturn(Optional.of(testUser));  // ✅ 사용자 조회 먼저
			given(postRepository.countByUserIdAndVisibility(1L, "public"))  // ✅ userId로 변경
				.willReturn(5L);

			// when
			long result = postService.getPostCountByVisibility("user@example.com", "public");

			// then
			assertThat(result).isEqualTo(5L);
		}

		@Test
		@DisplayName("게시글 상세 조회")
		void getPostDetail() {
			// given
			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));
			given(userRepository.findById(1L)).willReturn(Optional.of(testUser));  // ✅ JOIN용 Mock

			// when
			Optional<Detail> result = postService.getPostDetail(1L);

			// then
			assertThat(result).isPresent();
			Detail detail = result.get();
			assertThat(detail.getId()).isEqualTo(1L);
			assertThat(detail.getUserEmail()).isEqualTo("user@example.com");
			assertThat(detail.getUserNickname()).isEqualTo("테스트사용자");
		}
	}

	@Nested
	@DisplayName("게시글 수정")
	class UpdatePostTest {

		@Test
		@DisplayName("정상적인 게시글 수정")
		void updatePost() {
			// given
			UpdateRequest request = UpdateRequest.builder()
				.content("수정된 내용")
				.visibility("private")
				.build();

			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));
			given(userRepository.findById(1L)).willReturn(Optional.of(testUser));  // ✅ 권한 검증용 Mock
			given(postRepository.save(testPost)).willReturn(testPost);

			// when
			Detail result = postService.updatePost(1L, request, "user@example.com");

			// then
			assertThat(testPost.getContent()).isEqualTo("수정된 내용");
			assertThat(testPost.getVisibility()).isEqualTo("private");
		}
	}

	@Nested
	@DisplayName("게시글 삭제")
	class DeletePostTest {

		@Test
		@DisplayName("정상적인 게시글 삭제")
		void deletePost() {
			// given
			given(postRepository.findById(1L)).willReturn(Optional.of(testPost));
			given(userRepository.findById(1L)).willReturn(Optional.of(testUser));  // ✅ 권한 검증용 Mock

			// when
			postService.deletePost(1L, "user@example.com");

			// then
			verify(postRepository).deleteById(1L);
		}
	}
}
