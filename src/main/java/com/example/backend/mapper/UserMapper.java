package com.example.backend.mapper;

import java.time.LocalDateTime;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.factory.Mappers;

import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.RegistrationRequest;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.entity.UserEntity;

/**
 * User 관련 DTO-Entity 매퍼 (Ambiguous 에러 해결)
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    // === Entity to DTO 매핑 ===

    Profile toProfile(UserEntity entity);

    // Summary toSummary(UserEntity entity);

    // === DTO to Entity 매핑 (명시적 매핑) ===

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "password", ignore = true) // 서비스에서 인코딩 처리
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    @Mapping(target = "role", constant = "USER")
    @Mapping(target = "provider", constant = "local")
    @Mapping(target = "socialId", ignore = true)
    @Mapping(target = "email", source = "email", qualifiedByName = "normalizeEmail")
    @Mapping(target = "fullName", source = "fullName", qualifiedByName = "normalizeString")
    @Mapping(target = "nickname", source = "nickname", qualifiedByName = "normalizeString")
    @Mapping(target = "gender", source = "gender", qualifiedByName = "normalizeString")
    @Mapping(target = "phoneNumber", source = "phoneNumber", qualifiedByName = "normalizeString")
    @Mapping(target = "mentalState", source = "mentalState", qualifiedByName = "normalizeString")
    @Mapping(target = "chatGoal", source = "chatGoal", qualifiedByName = "normalizeString")
    @Mapping(target = "chatStyle", source = "chatStyle", qualifiedByName = "normalizeString")
    @Mapping(target = "termsVersion", source = "termsVersion", qualifiedByName = "normalizeString")
    @Mapping(target = "termsAcceptedAt", expression = "java(mapTermsAcceptedAt(request.getTermsAccepted()))")
    UserEntity toEntity(RegistrationRequest request);

    // === 업데이트 매핑 ===

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "email", ignore = true) // 이메일은 수정 불가
    @Mapping(target = "password", ignore = true) // 비밀번호는 별도 API
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "provider", ignore = true)
    @Mapping(target = "socialId", ignore = true)
    @Mapping(target = "termsAccepted", ignore = true)
    @Mapping(target = "termsAcceptedAt", ignore = true)
    @Mapping(target = "termsVersion", ignore = true)
    @Mapping(target = "fullName", source = "fullName", qualifiedByName = "normalizeString")
    @Mapping(target = "nickname", source = "nickname", qualifiedByName = "normalizeString")
    @Mapping(target = "gender", source = "gender", qualifiedByName = "normalizeString")
    @Mapping(target = "phoneNumber", source = "phoneNumber", qualifiedByName = "normalizeString")
    @Mapping(target = "mentalState", source = "mentalState", qualifiedByName = "normalizeString")
    @Mapping(target = "chatGoal", source = "chatGoal", qualifiedByName = "normalizeString")
    @Mapping(target = "chatStyle", source = "chatStyle", qualifiedByName = "normalizeString")
    void applyUpdate(@MappingTarget UserEntity entity, UpdateRequest request);

    // === 소셜 사용자 생성 매핑 ===

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "password", constant = "")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "lastLoginAt", ignore = true)
    @Mapping(target = "role", constant = "USER")
    @Mapping(target = "age", constant = "0")
    @Mapping(target = "gender", constant = "unknown")
    @Mapping(target = "termsAccepted", constant = "false")
    @Mapping(target = "chatStyle", constant = "")
    @Mapping(target = "email", source = "email", qualifiedByName = "normalizeEmail")
    @Mapping(target = "fullName", source = "fullName", qualifiedByName = "normalizeString")
    @Mapping(target = "nickname", source = "nickname", qualifiedByName = "normalizeString")
    UserEntity createSocialUser(String email, String fullName, String nickname, String provider, String socialId);

    // === @Named 헬퍼 메서드 (Ambiguous 에러 해결) ===

    @Named("normalizeEmail")
    default String normalizeEmail(String email) {
        return email != null ? email.trim().toLowerCase() : null;
    }

    @Named("normalizeString")
    default String normalizeString(String value) {
        return value != null ? value.trim() : null;
    }

    // === 기타 헬퍼 메서드 ===

    default LocalDateTime mapTermsAcceptedAt(Boolean termsAccepted) {
        return Boolean.TRUE.equals(termsAccepted) ? LocalDateTime.now() : null;
    }
}
