package com.example.backend.service.impl;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.common.error.ConflictException;
import com.example.backend.common.error.NotFoundException;
import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.RegistrationRequest;
import com.example.backend.dto.user.Summary;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.entity.UserEntity;
import com.example.backend.mapper.UserMapper;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.RecentAuthenticationService;
import com.example.backend.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final UserMapper userMapper;
	private RecentAuthenticationService recentAuthenticationService;

	@Override
	@Transactional
	public Profile register(RegistrationRequest request) {
		// 1) 중복 선검사 → 409
		if (userRepository.existsByEmail(request.getEmail())) {
			throw new ConflictException("이미 사용중인 이메일입니다.", "DUPLICATE_EMAIL", "email"); // 409 [1]
		}
		if (request.getNickname() != null && userRepository.existsByNickname(request.getNickname())) {
			throw new ConflictException("이미 사용중인 닉네임입니다.", "DUPLICATE_NICKNAME", "nickname"); // 409 [1]
		}

		// 2) 유도값 정규화/보정
		normalizeRequest(request);

		// 3) 엔티티 생성 (약관 필드 원자적 설정 포함)
		UserEntity user = createUserEntity(request);

		// 4) 저장
		UserEntity saved = userRepository.save(user);
		log.info("새 사용자 가입 완료: {}", saved.getEmail());

		// 5) 응답 DTO 매핑
		return userMapper.toProfile(saved);
	}

	private void normalizeRequest(RegistrationRequest req) {
		if (req.getEmail() != null) req.setEmail(req.getEmail().trim().toLowerCase());
		if (req.getNickname() != null) req.setNickname(req.getNickname().trim());
		if (req.getFullName() != null) req.setFullName(req.getFullName().trim());
		if (req.getGender() != null) req.setGender(req.getGender().trim().toLowerCase()); // male|female|other|unknown
		if (req.getPhoneNumber() != null) req.setPhoneNumber(req.getPhoneNumber().trim());
		if (req.getMentalState() != null) req.setMentalState(req.getMentalState().trim());
		if (req.getTermsVersion() != null) req.setTermsVersion(req.getTermsVersion().trim());
	}
	private UserEntity createUserEntity(RegistrationRequest request) {
		UserEntity u = new UserEntity();

		// 필수/기초
		u.setEmail(request.getEmail());

		// 비밀번호: null/blank 방지 후 인코딩
		if (request.getPassword() != null && !request.getPassword().isBlank()) {
			u.setPassword(passwordEncoder.encode(request.getPassword())); // BCrypt는 null에서 IAE [10]
		} else {
			// 소셜 가입이 아니라면 비밀번호는 필수. 여기까지 내려오면 컨트롤러 @Valid가 보장해야 하지만,
			// 방어적으로 IllegalArgumentException을 명확 메시지로 던질 수 있음(전역 400 매핑)
			throw new IllegalArgumentException("password is required for local registration");
		}

		// 선택/프로필
		u.setFullName(request.getFullName());
		u.setNickname(request.getNickname());
		u.setGender(request.getGender());         // 엔티티 @Pattern으로 제한됨
		u.setAge(request.getAge());
		u.setPhoneNumber(request.getPhoneNumber());
		u.setMentalState(request.getMentalState());

		// 역할/프로바이더 표준
		u.setRole("USER");                        // 엔티티 @Pattern USER|ADMIN [상수화 고려]
		u.setProvider("local");                   // 이메일·비번 기반 가입은 local로 표준화

		// 약관 필드 세트
		if (Boolean.TRUE.equals(request.getTermsAccepted())) {
			u.setTermsAccepted(Boolean.TRUE);
			u.setTermsAcceptedAt(java.time.LocalDateTime.now());
			// 요청에 termsVersion이 오면 사용, 없으면 시스템 현재 약관 버전 주입(예: Config/DB에서)
			// 현재 약관 관련 구상만 있으니 보류
			// u.setTermsVersion(request.getTermsVersion() != null
			// 	? request.getTermsVersion()
			// 	: currentTermsVersionProvider.get()); // 주입받는 컴포넌트
		} else {
			// false 또는 null → DB 기본 정책에 맞게 처리
			u.setTermsAccepted(Boolean.FALSE);
			u.setTermsAcceptedAt(null);
			u.setTermsVersion(null);
		}

		return u;
	}

	@Override
	@Transactional
	public Profile updateUser(String email, UpdateRequest request) {
		UserEntity user = userRepository.findByEmail(email)
			.orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
		if (request.getNickname() != null
			&& !request.getNickname().equals(user.getNickname())
			&& userRepository.existsByNickname(request.getNickname())) {
			throw new RuntimeException("이미 사용중인 닉네임입니다.");
		}
		// 매퍼를 통해 부분 업데이트 적용
		userMapper.applyUpdate(user, request);
		UserEntity updated = userRepository.save(user);
		log.info("사용자 정보 업데이트 완료: {}", email);
		return userMapper.toProfile(updated);
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<Profile> getUserByEmail(String email) {
		return userRepository.findByEmail(email).map(userMapper::toProfile);
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<Summary> getUserByNickname(String nickname) {
		return userRepository.findByNickname(nickname).map(Summary::new);
	}

	@Override
	@Transactional
	public void deleteUser(String email) {
		UserEntity user = userRepository.findByEmail(email)
			.orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
		userRepository.delete(user);
		log.info("사용자 삭제 완료: {}", email);
	}

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

	@Override
	@Transactional
	public UserEntity findOrCreateSocialUser(String email, String nickname, String provider) {
		return userRepository.findByEmail(email).orElseGet(() -> {
			UserEntity u = new UserEntity();
			u.setEmail(email);
			u.setFullName(nickname != null && !nickname.isBlank() ? nickname : provider + " User");
			u.setNickname(generateUniqueNickname(nickname, provider));
			u.setRole("USER");
			u.setPassword("");            // 소셜 로그인 계정은 로컬 패스워드 미사용
			u.setAge(0);
			u.setGender("OTHER");
			return userRepository.save(u);
		});
	}

	private String generateUniqueNickname(String preferredName) {
		String base = (preferredName != null && !preferredName.trim().isEmpty())
			? preferredName.trim() : "user";
		String nickname = base;
		int suffix = 1;
		while (!isNicknameAvailable(nickname)) {
			nickname = base + "_" + suffix++;
			if (suffix > 100) { nickname = "user_" + System.currentTimeMillis(); break; }
		}
		return nickname;
	}

	private UserEntity createGoogleUser(String email, String nickname) {
		UserEntity u = new UserEntity();
		u.setEmail(email);
		u.setFullName(nickname != null ? nickname : "Google User");
		u.setNickname(generateUniqueNickname(nickname, "google"));
		u.setRole("USER");
		u.setPassword("");
		u.setAge(0);
		u.setGender("unspecified");
		return u;
	}

	private UserEntity createKakaoUser(String email, String nickname) {
		UserEntity u = new UserEntity();
		u.setEmail(email);
		u.setFullName(nickname != null ? nickname : "Kakao User");
		u.setNickname(generateUniqueNickname(nickname, "kakao"));
		u.setRole("USER");
		u.setPassword("");
		u.setAge(0);
		u.setGender("unspecified");
		return u;
	}

	private String generateUniqueNickname(String preferredName, String provider) {
		String base = (preferredName != null && !preferredName.trim().isEmpty())
			? preferredName.trim() : provider + "_user";
		if (base.length() > 15) base = base.substring(0, 15);
		String nickname = base;
		int suffix = 1;
		while (!isNicknameAvailable(nickname)) {
			nickname = base + "_" + suffix++;
			if (suffix > 100) { nickname = provider + "_" + System.currentTimeMillis(); break; }
		}
		return nickname;
	}

	@Override
	@Transactional
	public void changePasswordWithReAuth(String email, String currentPassword, String newPassword) {
		UserEntity user = userRepository.findByEmail(email)
			.orElseThrow(() -> new NotFoundException("User not found"));

		// 재인증 검증
		recentAuthenticationService.requirePasswordReauth(user.getEmail(), currentPassword);

		// 기존 로직 + 토큰 무효화
		user.setPassword(passwordEncoder.encode(newPassword));
		userRepository.save(user);

		// 선택사항: 모든 세션 무효화
		// sessionRegistry.getAllSessions(user.getEmail(), false).forEach(SessionInformation::expireNow);

		log.info("Password changed successfully for user: {}", email);
	}

	@Override
	@Transactional
	public void deleteAccountWithReAuth(String email, String currentPassword) {
		UserEntity user = userRepository.findByEmail(email)
			.orElseThrow(() -> new NotFoundException("User not found"));

		// 재인증 검증
		recentAuthenticationService.requirePasswordReauth(user.getEmail(), currentPassword);

		// 기존 삭제 로직
		userRepository.delete(user);

		log.info("Account deleted successfully for user: {}", email);
	}
	@Override
	public void changePasswordWithCurrentCheck(String email, String currentPassword, String newPassword, String confirmPassword) {
		// ✅ 비밀번호 확인 검증
		if (!newPassword.equals(confirmPassword)) {
			throw new IllegalArgumentException("새 비밀번호와 비밀번호 확인이 일치하지 않습니다");
		}

		// 기존 로직
		UserEntity user = userRepository.findByEmail(email)
			.orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다"));

		if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
			throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다");
		}

		user.setPassword(passwordEncoder.encode(newPassword));
		userRepository.save(user);
	}
}
