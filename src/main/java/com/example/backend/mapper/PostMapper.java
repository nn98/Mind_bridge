package com.example.backend.mapper;

import java.util.List;

import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import com.example.backend.dto.post.CreateRequest;
import com.example.backend.dto.post.Detail;
import com.example.backend.dto.post.Summary;
import com.example.backend.entity.PostEntity;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.UserRepository;

@Mapper(
	componentModel = "spring",
	nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
	unmappedTargetPolicy = ReportingPolicy.WARN
)
public interface PostMapper {

	// ================== CREATE: Request → Entity ==================

	@Mapping(target = "postId", ignore = true)
	@Mapping(target = "userId", source = "user.userId")
	@Mapping(target = "title", source = "request.title", qualifiedByName = "normalizeTitle")
	@Mapping(target = "content", source = "request.content", qualifiedByName = "trimString")
	@Mapping(target = "visibility", source = "request.visibility", defaultValue = "PUBLIC")
	@Mapping(target = "status", constant = "active")
	@Mapping(target = "likeCount", constant = "0")
	@Mapping(target = "commentCount", constant = "0")
	@Mapping(target = "viewCount", constant = "0")
	@Mapping(target = "createdAt", ignore = true)
	@Mapping(target = "updatedAt", ignore = true)
	PostEntity toEntity(CreateRequest request, UserEntity user);

	// ================== READ: Entity → Detail (with Author) ==================

	@Mapping(target = "id", source = "post.postId")
	@Mapping(target = "title", source = "post.title")
	@Mapping(target = "content", source = "post.content")
	@Mapping(target = "userEmail", source = "author.email")
	@Mapping(target = "userNickname", source = "author.nickname")
	@Mapping(target = "visibility", source = "post.visibility")
	@Mapping(target = "createdAt", source = "post.createdAt")
	@Mapping(target = "updatedAt", source = "post.updatedAt")
	@Mapping(target = "likeCount", source = "post.likeCount")
	@Mapping(target = "commentCount", source = "post.commentCount")
	@Mapping(target = "likedByCurrentUser", constant = "false") // TODO: 구현
	Detail toDetail(PostEntity post, UserEntity author);

	// ================== READ: Entity → Summary (with Author) ==================

	@Mapping(target = "id", source = "post.postId")
	@Mapping(target = "contentPreview", source = "post.content", qualifiedByName = "truncateContent")
	@Mapping(target = "userNickname", source = "author.nickname")
	@Mapping(target = "visibility", source = "post.visibility")
	@Mapping(target = "createdAt", source = "post.createdAt")
	@Mapping(target = "likeCount", source = "post.likeCount")
	@Mapping(target = "commentCount", source = "post.commentCount")
	Summary toSummary(PostEntity post, UserEntity author);

	// ================== 리스트 매핑 (완전히 기존 로직 재현) ==================

	/**
	 * PostEntity 리스트를 Detail 리스트로 변환 (기존 mapToDetail 로직 재현)
	 */
	default List<Detail> toDetailList(List<PostEntity> posts, @Context UserRepository userRepository) {
		return posts.stream()
			.map(post -> {
				UserEntity author = userRepository.findById(post.getUserId())
					.orElse(createDeletedUserPlaceholder()); // ✅ 기존 로직 동일
				return toDetail(post, author);
			})
			.toList();
	}

	/**
	 * PostEntity 리스트를 Summary 리스트로 변환 (기존 mapToSummary 로직 재현)
	 */
	default List<Summary> toSummaryList(List<PostEntity> posts, @Context UserRepository userRepository) {
		return posts.stream()
			.map(post -> {
				UserEntity author = userRepository.findById(post.getUserId())
					.orElse(createDeletedUserPlaceholder()); // ✅ 기존 로직 동일
				return toSummary(post, author);
			})
			.toList();
	}

	/**
	 * 단일 PostEntity를 Detail로 변환 (기존 mapToDetail 로직 재현)
	 */
	default Detail toDetail(PostEntity post, @Context UserRepository userRepository) {
		UserEntity author = userRepository.findById(post.getUserId())
			.orElse(createDeletedUserPlaceholder()); // ✅ 기존 로직 동일
		return toDetail(post, author);
	}

	/**
	 * 단일 PostEntity를 Summary로 변환 (기존 mapToSummary 로직 재현)
	 */
	default Summary toSummary(PostEntity post, @Context UserRepository userRepository) {
		UserEntity author = userRepository.findById(post.getUserId())
			.orElse(createDeletedUserPlaceholder()); // ✅ 기존 로직 동일
		return toSummary(post, author);
	}

	// ================== 헬퍼 메서드 (기존 로직 완벽 재현) ==================

	@Named("normalizeTitle")
	default String normalizeTitle(String title) {
		// ✅ 기존 normalizeTitle 로직 완벽 재현
		if (title == null || title.isBlank()) {
			return "제목 없음";
		}
		return title.trim();
	}

	@Named("trimString")
	default String trimString(String value) {
		return value != null ? value.trim() : null;
	}

	@Named("truncateContent")
	default String truncateContent(String content) {
		// ✅ 기존 truncateContent 로직 완벽 재현 (maxLength=100 고정)
		if (content == null || content.length() <= 100) {
			return content;
		}
		return content.substring(0, 100) + "...";
	}

	/**
	 * 기존 createDeletedUserPlaceholder 로직 완벽 재현
	 */
	default UserEntity createDeletedUserPlaceholder() {
		return UserEntity.builder()
			.userId(-1L)
			.email("deleted@user.com")
			.nickname("탈퇴한 사용자")
			.fullName("탈퇴한 사용자")
			.build();
	}
}
