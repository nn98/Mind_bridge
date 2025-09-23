package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.common.error.BadRequestException;
import com.example.backend.common.error.ConflictException;
import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.user.ChangePasswordRequest;
import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.RegistrationRequest;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.entity.UserEntity;
import com.example.backend.mapper.UserMapper;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.RecentAuthenticationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 개선된 사용자 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final UserMapper userMapper;
	private final RecentAuthenticationService recentAuthenticationService;

	// === 사용자 등록 ===
	public Profile register(RegistrationRequest request) {
		// 1) 첫 번째 중복 검사
		validateDuplicates(request.getEmail(), request.getNickname());

		// 2) 데이터 정규화 (일부만 수행, 주요한 것은 mapper에서)
		normalizeRegistrationRequest(request);

		// 3) 엔티티 생성 및 비밀번호 설정
		UserEntity user = userMapper.toEntity(request);
		setEncodedPassword(user, request.getPassword());
		setTermsFields(user, request);

		// 4) ✅ 두 번째 중복 검사 (동시성 대응) - 정규화된 값으로 재검사
		if (userRepository.existsByEmail(user.getEmail())) {
			throw new ConflictException("이미 사용중인 이메일입니다.", "DUPLICATE_EMAIL", "email");
		}
		if (userRepository.existsByNickname(user.getNickname())) {
			throw new ConflictException("이미 사용중인 닉네임입니다.", "DUPLICATE_NICKNAME", "nickname");
		}

		// 5) 저장
		UserEntity saved = userRepository.save(user);
		log.info("새 사용자 가입 완료: {}", saved.getEmail());

		return userMapper.toProfile(saved);
	}

	// === 사용자 정보 수정 ===
	public Profile updateUser(String email, UpdateRequest request) {
		UserEntity user = findUserByEmail(email);

		// 닉네임 중복 검사 (본인 제외)
		if (request.getNickname() != null
			&& !request.getNickname().equals(user.getNickname())
			&& userRepository.existsByNickname(request.getNickname())) {
			throw new ConflictException("이미 사용중인 닉네임입니다.", "DUPLICATE_NICKNAME", "nickname");
		}

		// 매퍼를 통한 부분 업데이트
		userMapper.applyUpdate(user, request);
		UserEntity updated = userRepository.save(user);

		log.info("사용자 정보 업데이트 완료: {}", email);
		return userMapper.toProfile(updated);
	}

	// === 사용자 조회 ===
	@Transactional(readOnly = true)
	public Optional<Profile> getUserByEmail(String email) {
		if (email == null || email.isBlank()) {
			return Optional.empty();
		}
		return userRepository.findByEmail(email).map(userMapper::toProfile);
	}

	@Transactional(readOnly = true)
	public Optional<Profile> getUserById(Long userId) {
		if (userId == null || userId <= 0) {
			return Optional.empty();
		}
		return userRepository.findById(userId).map(userMapper::toProfile);
	}

	@Transactional(readOnly = true)
	public Optional<Profile> getUserByNickname(String nickname) {
		if (nickname == null || nickname.isBlank()) {
			return Optional.empty();
		}
		return userRepository.findByNickname(nickname).map(userMapper::toProfile);
	}

	// === 사용자 삭제 ===
	public void deleteUser(String email) {
		UserEntity user = findUserByEmail(email);
		userRepository.delete(user);
		log.info("사용자 삭제 완료: {}", email);
	}

	public void deleteAccountWithReAuth(String email, String currentPassword) {
		UserEntity user = findUserByEmail(email);
		recentAuthenticationService.requirePasswordReauth(user.getEmail(), currentPassword);
		userRepository.delete(user);
		log.info("재인증 후 계정 삭제 완료: {}", email);
	}

	@Transactional(readOnly = true)
	public boolean isEmailAvailable(String email) {
		if (email == null || email.isBlank()) {
			return false;
		}
		// ✅ UserMapper 사용으로 변경
		String normalizedEmail = userMapper.normalizeEmail(email);
		return !userRepository.existsByEmail(normalizedEmail);
	}

	@Transactional(readOnly = true)
	public boolean isNicknameAvailable(String nickname) {
		if (nickname == null || nickname.isBlank()) {
			return false;
		}
		// ✅ UserMapper 사용으로 변경
		String normalizedNickname = userMapper.normalizeString(nickname);
		if (normalizedNickname == null || normalizedNickname.isBlank()) {
			return false;
		}
		return !userRepository.existsByNickname(normalizedNickname);
	}

	// === 비밀번호 관리 ===
	public void changePassword(String email, ChangePasswordRequest request) {
		UserEntity user = findUserByEmail(email);

		if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
			throw new BadRequestException("현재 비밀번호가 일치하지 않습니다.", "INVALID_CURRENT_PASSWORD", "currentPassword");
		}

		if (!request.getPassword().equals(request.getConfirmPassword())) {
			throw new BadRequestException("비밀번호와 확인 비밀번호가 일치하지 않습니다.", "PASSWORD_MISMATCH", "confirmPassword");
		}

		user.setPassword(passwordEncoder.encode(request.getPassword()));
		userRepository.save(user);

		log.info("비밀번호 변경 완료: {}", email);
	}

	public void changePasswordWithReAuth(String email, String currentPassword, String newPassword) {
		UserEntity user = findUserByEmail(email);
		recentAuthenticationService.requirePasswordReauth(user.getEmail(), currentPassword);
		user.setPassword(passwordEncoder.encode(newPassword));
		userRepository.save(user);
		log.info("재인증 후 비밀번호 변경 완료: {}", email);
	}

	public void changePasswordWithCurrentCheck(String email, String currentPassword, String newPassword, String confirmPassword) {
		UserEntity user = findUserByEmail(email);

		if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
			throw new BadRequestException("현재 비밀번호가 일치하지 않습니다.", "INVALID_CURRENT_PASSWORD", "currentPassword");
		}

		if (!newPassword.equals(confirmPassword)) {
			throw new BadRequestException("비밀번호와 확인 비밀번호가 일치하지 않습니다.", "PASSWORD_MISMATCH", "confirmPassword");
		}

		user.setPassword(passwordEncoder.encode(newPassword));
		userRepository.save(user);

		log.info("현재 비밀번호 확인 후 변경 완료: {}", email);
	}

	public UserEntity findOrCreateSocialUser(String email, String nickname, String provider) {
		return userRepository.findByEmail(email)
			.orElseGet(() -> createSocialUser(email, nickname, provider));
	}

	// === 통계 및 유틸리티 ===
	@Transactional(readOnly = true)
	public long getUserCount() {
		return userRepository.count();
	}

	@Transactional(readOnly = true)
	public long getUserCountByRole(String role) {
		if (role == null || role.isBlank()) {
			return 0L;
		}
		return userRepository.countByRole(role);
	}

	@Transactional(readOnly = true)
	public List<Profile> getRecentUsers() {
		return userRepository.findTop10ByOrderByCreatedAtDesc()
			.stream()
			.map(userMapper::toProfile)
			.toList();
	}

	@Transactional(readOnly = true)
	public List<Profile> getRecentUsers(int limit) {
		if (limit <= 0 || limit > 100) {
			throw new BadRequestException("조회 개수는 1~100 사이여야 합니다.", "INVALID_LIMIT", "limit");
		}

		return userRepository.findTopNByOrderByCreatedAtDesc(limit)
			.stream()
			.map(userMapper::toProfile)
			.toList();
	}

	@Transactional(readOnly = true)
	public Optional<Profile> findUserByPhoneAndNickname(String phoneNumber, String nickname) {
		if (phoneNumber == null || phoneNumber.isBlank() || nickname == null || nickname.isBlank()) {
			return Optional.empty();
		}
		return userRepository.findByPhoneNumberAndNickname(phoneNumber, nickname)
			.map(userMapper::toProfile);
	}

	public void updateLastLoginTime(String email) {
		int updated = userRepository.touchLastLogin(email);
		if (updated > 0) {
			log.debug("마지막 로그인 시간 업데이트: {}", email);
		}
	}

	// === Private Helper Methods ===
	private void validateDuplicates(String email, String nickname) {
		String normalizedEmail = email != null ? userMapper.normalizeEmail(email) : null;
		String normalizedNickname = nickname != null ? userMapper.normalizeString(nickname) : null;

		if (normalizedEmail != null && userRepository.existsByEmail(normalizedEmail)) {
			throw new ConflictException("이미 사용중인 이메일입니다.", "DUPLICATE_EMAIL", "email");
		}
		if (normalizedNickname != null && userRepository.existsByNickname(normalizedNickname)) {
			throw new ConflictException("이미 사용중인 닉네임입니다.", "DUPLICATE_NICKNAME", "nickname");
		}
	}

	private void normalizeRegistrationRequest(RegistrationRequest request) {
		if (request.getFullName() != null) {
			request.setFullName(userMapper.normalizeString(request.getFullName()));
		}
		if (request.getGender() != null) {
			String normalizedGender = userMapper.normalizeString(request.getGender());
			request.setGender(normalizedGender != null ? normalizedGender.toLowerCase() : null);
		}
		if (request.getPhoneNumber() != null) {
			request.setPhoneNumber(userMapper.normalizeString(request.getPhoneNumber()));
		}
		if (request.getMentalState() != null) {
			request.setMentalState(userMapper.normalizeString(request.getMentalState()));
		}
		if (request.getChatStyle() != null) {
			request.setChatStyle(userMapper.normalizeString(request.getChatStyle()));
		}
	}

	private void setEncodedPassword(UserEntity user, String plainPassword) {
		if (plainPassword == null || plainPassword.isBlank()) {
			throw new BadRequestException("비밀번호는 필수입니다.", "MISSING_PASSWORD", "password");
		}
		user.setPassword(passwordEncoder.encode(plainPassword));
	}

	private void setTermsFields(UserEntity user, RegistrationRequest request) {
		if (Boolean.TRUE.equals(request.getTermsAccepted())) {
			user.setTermsAccepted(Boolean.TRUE);
			user.setTermsAcceptedAt(LocalDateTime.now());
			user.setTermsVersion(request.getTermsVersion());
		} else {
			user.setTermsAccepted(Boolean.FALSE);
			user.setTermsAcceptedAt(null);
			user.setTermsVersion(null);
		}
	}

	private UserEntity findUserByEmail(String email) {
		return userRepository.findByEmail(email)
			.orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다.", "USER_NOT_FOUND", "email"));
	}

	private UserEntity createSocialUser(String email, String nickname, String provider) {
		String uniqueNickname = generateUniqueNickname(nickname, provider);
		String displayName = nickname != null && !nickname.isBlank()
			? nickname : provider + " User";

		// socialId는 내부적으로 생성 (provider + timestamp 조합 등)
		String internalSocialId = provider + "_" + System.currentTimeMillis();

		UserEntity user = userMapper.createSocialUser(email, displayName, uniqueNickname, provider, internalSocialId);
		UserEntity saved = userRepository.save(user);

		log.info("새 소셜 사용자 생성 완료: email={}, provider={}, nickname={}", email, provider, uniqueNickname);
		return saved;
	}

	private String generateUniqueNickname(String preferredName, String provider) {
		String base = (preferredName != null && !preferredName.trim().isEmpty())
			? preferredName.trim() : provider + "_user";

		if (base.length() > 15) {
			base = base.substring(0, 15);
		}

		String nickname = base;
		int suffix = 1;

		// ✅ 안전 장치 추가 - 최대 10번만 시도
		while (nickname != null && userRepository.existsByNickname(nickname) && suffix <= 10) {
			nickname = base + "_" + suffix++;
		}

		// ✅ 10번 시도해도 실패하면 타임스탬프 사용
		if (suffix > 10) {
			nickname = provider + "_" + System.currentTimeMillis();
		}

		return nickname;
	}
}
