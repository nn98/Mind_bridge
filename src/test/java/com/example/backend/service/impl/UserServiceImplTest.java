package com.example.backend.service.impl;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

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

/**
 * UserServiceImpl 테스트 - 수정된 도메인 예외와 한글 메시지 반영
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl 테스트")
class UserServiceImplTest {

	@InjectMocks
	private UserServiceImpl userService;

	@Mock
	private UserRepository userRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@Mock
	private UserMapper userMapper;

	@Mock
	private RecentAuthenticationService recentAuthenticationService;

	private UserEntity testUser;
	private RegistrationRequest registrationRequest;
	private Profile testProfile;

	@BeforeEach
	void setUp() {
		testUser = UserEntity.builder()
			.userId(1L)
			.email("test@example.com")
			.nickname("테스트유저")
			.password("encodedPassword")
			.role("USER")
			.provider("local")
			.termsAccepted(true)
			.build();

		registrationRequest = RegistrationRequest.builder()
			.email("test@example.com")
			.password("Test123!@#")
			.nickname("테스트유저")
			.fullName("테스트 사용자")
			.age(25)
			.gender("male")
			.termsAccepted(true)
			.build();

		testProfile = Profile.builder()
			.userId(1L)
			.email("test@example.com")
			.nickname("테스트유저")
			.fullName("테스트 사용자")
			.build();
	}

	// === 사용자 등록 테스트 ===

	@Test
	@DisplayName("사용자 등록 성공")
	void register_성공() {
		// given
		given(userRepository.existsByEmail("test@example.com")).willReturn(false);
		given(userRepository.existsByNickname("테스트유저")).willReturn(false);
		given(userMapper.toEntity(any(RegistrationRequest.class))).willReturn(testUser);
		given(passwordEncoder.encode("Test123!@#")).willReturn("encodedPassword");
		given(userRepository.save(any(UserEntity.class))).willReturn(testUser);
		given(userMapper.toProfile(testUser)).willReturn(testProfile);

		// when
		Profile result = userService.register(registrationRequest);

		// then
		assertThat(result).isNotNull();
		assertThat(result.getEmail()).isEqualTo("test@example.com");
		assertThat(result.getNickname()).isEqualTo("테스트유저");

		verify(userRepository).existsByEmail("test@example.com");
		verify(userRepository).existsByNickname("테스트유저");
		verify(userRepository).save(any(UserEntity.class));
	}

	@Test
	@DisplayName("이메일 중복으로 등록 실패")
	void register_이메일중복_ConflictException() {
		// given
		given(userRepository.existsByEmail("test@example.com")).willReturn(true);

		// when & then
		assertThatThrownBy(() -> userService.register(registrationRequest))
			.isInstanceOf(ConflictException.class)
			.hasMessage("이미 사용중인 이메일입니다.")
			.extracting("code").isEqualTo("DUPLICATE_EMAIL");
	}

	@Test
	@DisplayName("닉네임 중복으로 등록 실패")
	void register_닉네임중복_ConflictException() {
		// given
		given(userRepository.existsByEmail("test@example.com")).willReturn(false);
		given(userRepository.existsByNickname("테스트유저")).willReturn(true);

		// when & then
		assertThatThrownBy(() -> userService.register(registrationRequest))
			.isInstanceOf(ConflictException.class)
			.hasMessage("이미 사용중인 닉네임입니다.")
			.extracting("code").isEqualTo("DUPLICATE_NICKNAME");
	}

	@Test
	@DisplayName("비밀번호 없이 등록 실패")
	void register_비밀번호없음_BadRequestException() {
		// given
		registrationRequest.setPassword(null);
		given(userRepository.existsByEmail("test@example.com")).willReturn(false);
		given(userRepository.existsByNickname("테스트유저")).willReturn(false);
		given(userMapper.toEntity(any(RegistrationRequest.class))).willReturn(testUser);

		// when & then
		assertThatThrownBy(() -> userService.register(registrationRequest))
			.isInstanceOf(BadRequestException.class)
			.hasMessage("비밀번호는 필수입니다.")
			.extracting("code").isEqualTo("MISSING_PASSWORD");
	}

	// === 비밀번호 변경 테스트 ===

	@Test
	@DisplayName("비밀번호 변경 성공")
	void changePassword_성공() {
		// given
		ChangePasswordRequest request = ChangePasswordRequest.builder()
			.currentPassword("oldPassword")
			.password("newPassword123!@#")
			.confirmPassword("newPassword123!@#")
			.build();

		given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));
		given(passwordEncoder.matches("oldPassword", "encodedPassword")).willReturn(true);
		given(passwordEncoder.encode("newPassword123!@#")).willReturn("newEncodedPassword");

		// when
		userService.changePassword("test@example.com", request);

		// then
		verify(passwordEncoder).matches("oldPassword", "encodedPassword");
		verify(passwordEncoder).encode("newPassword123!@#");
		verify(userRepository).save(testUser);
		assertThat(testUser.getPassword()).isEqualTo("newEncodedPassword");
	}

	@Test
	@DisplayName("현재 비밀번호 불일치로 변경 실패")
	void changePassword_현재비밀번호불일치_BadRequestException() {
		// given
		ChangePasswordRequest request = ChangePasswordRequest.builder()
			.currentPassword("wrongPassword")
			.password("newPassword123!@#")
			.confirmPassword("newPassword123!@#")
			.build();

		given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));
		given(passwordEncoder.matches("wrongPassword", "encodedPassword")).willReturn(false);

		// when & then
		assertThatThrownBy(() -> userService.changePassword("test@example.com", request))
			.isInstanceOf(BadRequestException.class)
			.hasMessage("현재 비밀번호가 일치하지 않습니다.")
			.extracting("code").isEqualTo("INVALID_CURRENT_PASSWORD");
	}

	// === 사용자 조회 테스트 ===

	@Test
	@DisplayName("이메일로 사용자 조회 성공")
	void getUserByEmail_성공() {
		// given
		given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));
		given(userMapper.toProfile(testUser)).willReturn(testProfile);

		// when
		Optional<Profile> result = userService.getUserByEmail("test@example.com");

		// then
		assertThat(result).isPresent();
		assertThat(result.get().getEmail()).isEqualTo("test@example.com");
		assertThat(result.get().getNickname()).isEqualTo("테스트유저");
	}

	// === 사용자 정보 수정 테스트 ===

	@Test
	@DisplayName("사용자 정보 수정 성공")
	void updateUser_성공() {
		// given
		UpdateRequest updateRequest = UpdateRequest.builder()
			.fullName("수정된 이름")
			.age(30)
			.build();

		given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));
		given(userRepository.save(testUser)).willReturn(testUser);
		given(userMapper.toProfile(testUser)).willReturn(testProfile);

		// when
		Profile result = userService.updateUser("test@example.com", updateRequest);

		// then
		assertThat(result).isNotNull();
		verify(userMapper).applyUpdate(testUser, updateRequest);
		verify(userRepository).save(testUser);
	}

	@Test
	@DisplayName("사용자 정보 수정 - 존재하지 않는 사용자")
	void updateUser_사용자없음_NotFoundException() {
		// given
		UpdateRequest updateRequest = UpdateRequest.builder().fullName("수정된 이름").build();
		given(userRepository.findByEmail("test@example.com")).willReturn(Optional.empty());

		// when & then
		assertThatThrownBy(() -> userService.updateUser("test@example.com", updateRequest))
			.isInstanceOf(NotFoundException.class)
			.hasMessage("사용자를 찾을 수 없습니다.");
	}

	// === 소셜 사용자 테스트 ===

	@Test
	@DisplayName("소셜 사용자 생성 성공")
	void findOrCreateSocialUser_신규생성_성공() {
		// given
		UserEntity socialUser = UserEntity.builder()
			.email("social@example.com")
			.nickname("google_user_1")
			.provider("google")
			.role("USER")
			.build();

		given(userRepository.findByEmail("social@example.com")).willReturn(Optional.empty());
		given(userMapper.createSocialUser(eq("social@example.com"), any(), any(), eq("google"), isNull()))
			.willReturn(socialUser);
		given(userRepository.save(socialUser)).willReturn(socialUser);

		// when
		UserEntity result = userService.findOrCreateSocialUser("social@example.com", "구글사용자", "google");

		// then
		assertThat(result).isNotNull();
		assertThat(result.getEmail()).isEqualTo("social@example.com");
		assertThat(result.getProvider()).isEqualTo("google");
		verify(userRepository).save(socialUser);
	}

	// === 가용성 확인 테스트 ===

	@Test
	@DisplayName("이메일 가용성 확인 - 사용 가능")
	void isEmailAvailable_사용가능() {
		// given
		given(userRepository.existsByEmail("new@example.com")).willReturn(false);

		// when
		boolean result = userService.isEmailAvailable("new@example.com");

		// then
		assertThat(result).isTrue();
	}

	@Test
	@DisplayName("닉네임 가용성 확인 - 사용 불가")
	void isNicknameAvailable_사용불가() {
		// given
		given(userRepository.existsByNickname("기존닉네임")).willReturn(true);

		// when
		boolean result = userService.isNicknameAvailable("기존닉네임");

		// then
		assertThat(result).isFalse();
	}

	// === 삭제 테스트 ===

	@Test
	@DisplayName("사용자 삭제 성공")
	void deleteUser_성공() {
		// given
		given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));

		// when
		userService.deleteUser("test@example.com");

		// then
		verify(userRepository).delete(testUser);
	}

	@Test
	@DisplayName("재인증 후 계정 삭제 성공")
	void deleteAccountWithReAuth_성공() {
		// given
		given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));
		doNothing().when(recentAuthenticationService)
			.requirePasswordReauth("test@example.com", "currentPassword");

		// when
		userService.deleteAccountWithReAuth("test@example.com", "currentPassword");

		// then
		verify(recentAuthenticationService).requirePasswordReauth("test@example.com", "currentPassword");
		verify(userRepository).delete(testUser);
	}
}
