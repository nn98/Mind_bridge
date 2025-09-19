package com.example.backend.service.impl;

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
import com.example.backend.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 개선된 사용자 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final UserMapper userMapper;
	private final RecentAuthenticationService recentAuthenticationService;

	// === 사용자 등록 ===

	@Override
	public Profile register(RegistrationRequest request) {
		// 1) 중복 검사
		validateDuplicates(request.getEmail(), request.getNickname());

		// 2) 데이터 정규화
		normalizeRegistrationRequest(request);

		// 3) 엔티티 생성 및 비밀번호 설정
		UserEntity user = userMapper.toEntity(request);
		setEncodedPassword(user, request.getPassword());
		setTermsFields(user, request);

		// 4) 저장
		UserEntity saved = userRepository.save(user);
		log.info("새 사용자 가입 완료: {}", saved.getEmail());

		return userMapper.toProfile(saved);
	}

	// === 사용자 정보 수정 ===

	@Override
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

	@Override
	@Transactional(readOnly = true)
	public Optional<Profile> getUserByEmail(String email) {
		return userRepository.findByEmail(email).map(userMapper::toProfile);
	}

	// @Override
	// @Transactional(readOnly = true)
	// public Optional<Summary> getUserByNickname(String nickname) {
	// 	return userRepository.findByNickname(nickname).map(userMapper::toSummary);
	// }

	// === 사용자 삭제 ===

	@Override
	public void deleteUser(String email) {
		UserEntity user = findUserByEmail(email);
		userRepository.delete(user);
		log.info("사용자 삭제 완료: {}", email);
	}

	@Override
	public void deleteAccountWithReAuth(String email, String currentPassword) {
		UserEntity user = findUserByEmail(email);
		recentAuthenticationService.requirePasswordReauth(user.getEmail(), currentPassword);

		userRepository.delete(user);
		log.info("재인증 후 계정 삭제 완료: {}", email);
	}

	// === 가용성 확인 ===

	@Override
	@Transactional(readOnly = true)
	public boolean isEmailAvailable(String email) {
		return !userRepository.existsByEmail(email);
	}

	@Override
	@Transactional(readOnly = true)
	public boolean isNicknameAvailable(String nickname) {
		return !userRepository.existsByNickname(nickname);
	}

	// === 비밀번호 관리 ===

	@Override
	public void changePassword(String email, ChangePasswordRequest request) {
		UserEntity user = findUserByEmail(email);

		if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
			throw new BadRequestException("현재 비밀번호가 일치하지 않습니다.", "INVALID_CURRENT_PASSWORD", "currentPassword");
		}

		user.setPassword(passwordEncoder.encode(request.getPassword()));
		userRepository.save(user);

		log.info("비밀번호 변경 완료: {}", email);
	}

	@Override
	public void changePasswordWithReAuth(String email, String currentPassword, String newPassword) {
		UserEntity user = findUserByEmail(email);
		recentAuthenticationService.requirePasswordReauth(user.getEmail(), currentPassword);

		user.setPassword(passwordEncoder.encode(newPassword));
		userRepository.save(user);

		log.info("재인증 후 비밀번호 변경 완료: {}", email);
	}

	// === 소셜 사용자 관리 ===

	@Override
	public UserEntity findOrCreateSocialUser(String email, String nickname, String provider) {
		return userRepository.findByEmail(email)
			.orElseGet(() -> createSocialUser(email, nickname, provider));
	}

	@Override
	public void changePasswordWithCurrentCheck(String email, String currentPassword, String newPassword,
		String confirmPassword) {

	}

	// === Private Helper Methods ===

	private void validateDuplicates(String email, String nickname) {
		if (userRepository.existsByEmail(email)) {
			throw new ConflictException("이미 사용중인 이메일입니다.", "DUPLICATE_EMAIL", "email");
		}
		if (nickname != null && userRepository.existsByNickname(nickname)) {
			throw new ConflictException("이미 사용중인 닉네임입니다.", "DUPLICATE_NICKNAME", "nickname");
		}
	}

	private void normalizeRegistrationRequest(RegistrationRequest request) {
		if (request.getEmail() != null) {
			request.setEmail(request.getEmail().trim().toLowerCase());
		}
		if (request.getNickname() != null) {
			request.setNickname(request.getNickname().trim());
		}
		if (request.getFullName() != null) {
			request.setFullName(request.getFullName().trim());
		}
		if (request.getGender() != null) {
			request.setGender(request.getGender().trim().toLowerCase());
		}
		if (request.getPhoneNumber() != null) {
			request.setPhoneNumber(request.getPhoneNumber().trim());
		}
		if (request.getMentalState() != null) {
			request.setMentalState(request.getMentalState().trim());
		}
		if (request.getChatStyle() != null) {
			request.setChatStyle(request.getChatStyle().trim());
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
			user.setTermsAcceptedAt(java.time.LocalDateTime.now());
			user.setTermsVersion(request.getTermsVersion());
		} else {
			user.setTermsAccepted(Boolean.FALSE);
			user.setTermsAcceptedAt(null);
			user.setTermsVersion(null);
		}
	}

	private UserEntity findUserByEmail(String email) {
		return userRepository.findByEmail(email)
			.orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
	}

	private UserEntity createSocialUser(String email, String nickname, String provider) {
		String uniqueNickname = generateUniqueNickname(nickname, provider);
		String displayName = nickname != null && !nickname.isBlank()
			? nickname : provider + " User";

		UserEntity user = userMapper.createSocialUser(email, displayName, uniqueNickname, provider, null);

		return userRepository.save(user);
	}

	private String generateUniqueNickname(String preferredName, String provider) {
		String base = (preferredName != null && !preferredName.trim().isEmpty())
			? preferredName.trim() : provider + "_user";

		if (base.length() > 15) {
			base = base.substring(0, 15);
		}

		String nickname = base;
		int suffix = 1;

		while (!isNicknameAvailable(nickname)) {
			nickname = base + "_" + suffix++;
			if (suffix > 100) {
				nickname = provider + "_" + System.currentTimeMillis();
				break;
			}
		}

		return nickname;
	}
}
