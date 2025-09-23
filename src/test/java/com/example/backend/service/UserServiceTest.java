package com.example.backend.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

import java.time.LocalDateTime;
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

@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl 통합 테스트")
class UserServiceTest {

	@InjectMocks
	private UserService userService;

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
	private LocalDateTime fixedTime;

	@BeforeEach
	void setUp() {
		fixedTime = LocalDateTime.of(2025, 9, 22, 15, 13, 0);

		testUser = UserEntity.builder()
			.userId(1L)
			.email("test@example.com")
			.nickname("테스트유저")
			.fullName("테스트 사용자")
			.password("encodedPassword123!")
			.role("USER")
			.provider("local")
			.age(25)
			.gender("male")
			.phoneNumber("010-1234-5678")
			.mentalState("stable")
			.chatGoal("상담 목적")
			.chatStyle("casual")
			.termsAccepted(true)
			.termsAcceptedAt(fixedTime)
			.termsVersion("v1.0")
			.createdAt(fixedTime)
			.updatedAt(fixedTime)
			.lastLoginAt(fixedTime.minusDays(1))
			.build();

		registrationRequest = RegistrationRequest.builder()
			.email("NEW@EXAMPLE.COM")
			.password("NewPassword123!@#")
			.fullName("  새 사용자  ")
			.nickname("  새유저  ")
			.age(30)
			.gender("FEMALE")
			.phoneNumber("010-9876-5432")
			.mentalState("anxious")
			.chatGoal("힐링을 위해")
			.chatStyle("formal")
			.termsAccepted(true)
			.termsVersion("v1.0")
			.build();

		testProfile = Profile.builder()
			.userId(1L)  // ✅ id → userId로 변경
			.email("test@example.com")
			.nickname("테스트유저")
			.fullName("테스트 사용자")
			.age(25)
			.gender("male")
			.phoneNumber("010-1234-5678")
			.mentalState("stable")
			.chatGoal("상담 목적")
			.chatStyle("casual")
			.build();
	}

	@Nested
	@DisplayName("사용자 등록")
	class RegisterTest {

		@Test
		@DisplayName("성공 - 모든 필드 포함")
		void register_모든필드포함_성공() {
			// given
			// ✅ UserMapper normalize 메서드들 스텁 추가
			given(userMapper.normalizeEmail("NEW@EXAMPLE.COM")).willReturn("new@example.com");
			given(userMapper.normalizeString("  새유저  ")).willReturn("새유저");
			given(userMapper.normalizeString("  새 사용자  ")).willReturn("새 사용자");
			given(userMapper.normalizeString("FEMALE")).willReturn("FEMALE");
			given(userMapper.normalizeString("010-9876-5432")).willReturn("010-9876-5432");
			given(userMapper.normalizeString("anxious")).willReturn("anxious");
			given(userMapper.normalizeString("formal")).willReturn("formal");

			given(userRepository.existsByEmail("new@example.com")).willReturn(false);
			given(userRepository.existsByNickname("새유저")).willReturn(false);
			given(passwordEncoder.encode("NewPassword123!@#")).willReturn("encodedNewPassword");

			UserEntity normalizedEntity = UserEntity.builder()
				.email("new@example.com")
				.fullName("새 사용자")
				.nickname("새유저")
				.gender("female")
				.phoneNumber("010-9876-5432")
				.role("USER")
				.provider("local")
				.age(30)
				.mentalState("anxious")
				.chatGoal("힐링을 위해")
				.chatStyle("formal")
				.termsAccepted(true)
				.termsAcceptedAt(fixedTime)
				.termsVersion("v1.0")
				.build();

			given(userMapper.toEntity(any(RegistrationRequest.class))).willReturn(normalizedEntity);

			ArgumentCaptor<UserEntity> saveCaptor = ArgumentCaptor.forClass(UserEntity.class);
			willAnswer(invocation -> {
				UserEntity saved = invocation.getArgument(0);
				saved.setUserId(2L);
				saved.setCreatedAt(fixedTime);
				saved.setUpdatedAt(fixedTime);
				return saved;
			}).given(userRepository).save(saveCaptor.capture());

			Profile expectedProfile = Profile.builder()
				.userId(2L)
				.email("new@example.com")
				.nickname("새유저")
				.fullName("새 사용자")
				.age(30)
				.gender("female")
				.phoneNumber("010-9876-5432")
				.mentalState("anxious")
				.chatGoal("힐링을 위해")
				.chatStyle("formal")
				.build();

			given(userMapper.toProfile(any(UserEntity.class))).willReturn(expectedProfile);

			// when
			Profile result = userService.register(registrationRequest);

			// then
			UserEntity savedEntity = saveCaptor.getValue();
			assertThat(savedEntity.getPassword()).isEqualTo("encodedNewPassword");

			assertThat(result).isNotNull();
			assertThat(result.getUserId()).isEqualTo(2L);
			assertThat(result.getEmail()).isEqualTo("new@example.com");
			assertThat(result.getNickname()).isEqualTo("새유저");
			assertThat(result.getFullName()).isEqualTo("새 사용자");
			assertThat(result.getAge()).isEqualTo(30);
		}

		@Test
		@DisplayName("성공 - 선택 필드 null")
		void register_선택필드null_성공() {
			// given
			RegistrationRequest minimalRequest = RegistrationRequest.builder()
				.email("minimal@example.com")
				.password("MinimalPass123!")
				.nickname("미니멀유저")
				.termsAccepted(true)
				.build();

			// ✅ 실제 호출되는 normalize만 스텁
			given(userMapper.normalizeEmail("minimal@example.com")).willReturn("minimal@example.com");
			given(userMapper.normalizeString("미니멀유저")).willReturn("미니멀유저");

			given(userRepository.existsByEmail("minimal@example.com")).willReturn(false);
			given(userRepository.existsByNickname("미니멀유저")).willReturn(false);
			given(passwordEncoder.encode("MinimalPass123!")).willReturn("encodedMinimalPassword");

			UserEntity minimalEntity = UserEntity.builder()
				.email("minimal@example.com")
				.nickname("미니멀유저")
				.role("USER")
				.provider("local")
				.termsAccepted(true)
				.termsAcceptedAt(fixedTime)
				.build();

			given(userMapper.toEntity(minimalRequest)).willReturn(minimalEntity);
			given(userRepository.save(any(UserEntity.class))).willAnswer(invocation -> {
				UserEntity saved = invocation.getArgument(0);
				saved.setUserId(3L);
				return saved;
			});
			given(userMapper.toProfile(any(UserEntity.class))).willReturn(
				Profile.builder()
					.userId(3L)  // ✅ userId 사용
					.email("minimal@example.com")
					.nickname("미니멀유저")
					.build()
			);

			// when
			Profile result = userService.register(minimalRequest);

			// then
			assertThat(result).isNotNull();
			assertThat(result.getUserId()).isEqualTo(3L);
			assertThat(result.getEmail()).isEqualTo("minimal@example.com");
			assertThat(result.getNickname()).isEqualTo("미니멀유저");
		}

		@Test
		@DisplayName("실패 - 이메일 중복")
		void register_이메일중복_ConflictException() {
			// given
			given(userRepository.existsByEmail("new@example.com")).willReturn(true);
			given(userMapper.normalizeEmail("NEW@EXAMPLE.COM")).willReturn("new@example.com");

			// when & then
			assertThatThrownBy(() -> userService.register(registrationRequest))
				.isInstanceOf(ConflictException.class)
				.hasMessage("이미 사용중인 이메일입니다.")
				.extracting("code").isEqualTo("DUPLICATE_EMAIL");

			verify(userRepository).existsByEmail("new@example.com");
			verify(userRepository, never()).save(any());
		}

		@Test
		@DisplayName("실패 - 닉네임 중복")
		void register_닉네임중복_ConflictException() {
			// given
			given(userRepository.existsByEmail("new@example.com")).willReturn(false);
			given(userRepository.existsByNickname("새유저")).willReturn(true);
			given(userMapper.normalizeEmail("NEW@EXAMPLE.COM")).willReturn("new@example.com");
			given(userMapper.normalizeString("  새유저  ")).willReturn("새유저");

			// when & then
			assertThatThrownBy(() -> userService.register(registrationRequest))
				.isInstanceOf(ConflictException.class)
				.hasMessage("이미 사용중인 닉네임입니다.")
				.extracting("code").isEqualTo("DUPLICATE_NICKNAME");
		}

		@Test
		@DisplayName("실패 - 비밀번호 없음")
		void register_비밀번호없음_BadRequestException() {
			// given
			registrationRequest.setPassword(null);

			// ✅ normalize 메서드들 기본 스텁 (null 처리)
			given(userMapper.normalizeEmail(any())).willAnswer(inv -> {
				String input = inv.getArgument(0);
				return input != null ? input.trim().toLowerCase() : null;
			});
			given(userMapper.normalizeString(any())).willAnswer(inv -> {
				String input = inv.getArgument(0);
				return input != null ? input.trim() : null;
			});

			given(userRepository.existsByEmail(any())).willReturn(false);
			given(userRepository.existsByNickname(any())).willReturn(false);
			given(userMapper.toEntity(any())).willReturn(testUser);

			// when & then
			assertThatThrownBy(() -> userService.register(registrationRequest))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("비밀번호는 필수입니다.")
				.extracting("code").isEqualTo("MISSING_PASSWORD");
		}
	}

	@Nested
	@DisplayName("비밀번호 변경")
	class ChangePasswordTest {

		@Test
		@DisplayName("성공")
		void changePassword_성공() {
			// given
			ChangePasswordRequest request = ChangePasswordRequest.builder()
				.currentPassword("oldPassword123!")
				.password("newPassword456@")
				.confirmPassword("newPassword456@")
				.build();

			given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));
			given(passwordEncoder.matches("oldPassword123!", "encodedPassword123!")).willReturn(true);
			given(passwordEncoder.encode("newPassword456@")).willReturn("encodedNewPassword456@");

			// when
			userService.changePassword("test@example.com", request);

			// then
			assertThat(testUser.getPassword()).isEqualTo("encodedNewPassword456@");
			verify(passwordEncoder).matches("oldPassword123!", "encodedPassword123!");
			verify(passwordEncoder).encode("newPassword456@");
			verify(userRepository).save(testUser);
		}

		@Test
		@DisplayName("실패 - 현재 비밀번호 불일치")
		void changePassword_현재비밀번호불일치_BadRequestException() {
			// given
			ChangePasswordRequest request = ChangePasswordRequest.builder()
				.currentPassword("wrongPassword")
				.password("newPassword456@")
				.confirmPassword("newPassword456@")
				.build();

			given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));
			given(passwordEncoder.matches("wrongPassword", "encodedPassword123!")).willReturn(false);

			// when & then
			assertThatThrownBy(() -> userService.changePassword("test@example.com", request))
				.isInstanceOf(BadRequestException.class)
				.hasMessage("현재 비밀번호가 일치하지 않습니다.")
				.extracting("code").isEqualTo("INVALID_CURRENT_PASSWORD");

			verify(userRepository, never()).save(any());
		}

		@Test
		@DisplayName("실패 - 사용자 없음")
		void changePassword_사용자없음_NotFoundException() {
			// given
			ChangePasswordRequest request = ChangePasswordRequest.builder()
				.currentPassword("oldPassword")
				.password("newPassword")
				.confirmPassword("newPassword")
				.build();

			given(userRepository.findByEmail("nonexistent@example.com")).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> userService.changePassword("nonexistent@example.com", request))
				.isInstanceOf(NotFoundException.class)
				.hasMessage("사용자를 찾을 수 없습니다.");
		}
	}

	@Nested
	@DisplayName("사용자 조회")
	class GetUserTest {

		@Test
		@DisplayName("이메일로 조회 성공")
		void getUserByEmail_성공() {
			// given
			given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));
			given(userMapper.toProfile(testUser)).willReturn(testProfile);

			// when
			Optional<Profile> result = userService.getUserByEmail("test@example.com");

			// then
			assertThat(result).isPresent();
			assertThat(result.get().getUserId()).isEqualTo(1L);  // ✅ getId() → getUserId()로 변경
			assertThat(result.get().getEmail()).isEqualTo("test@example.com");
			assertThat(result.get().getNickname()).isEqualTo("테스트유저");
			assertThat(result.get().getAge()).isEqualTo(25);
			assertThat(result.get().getMentalState()).isEqualTo("stable");
		}

		@Test
		@DisplayName("이메일로 조회 - 없음")
		void getUserByEmail_없음() {
			// given
			given(userRepository.findByEmail("nonexistent@example.com")).willReturn(Optional.empty());

			// when
			Optional<Profile> result = userService.getUserByEmail("nonexistent@example.com");

			// then
			assertThat(result).isEmpty();
		}

		@Test
		@DisplayName("ID로 조회 성공")
		void getUserById_성공() {
			// given
			given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
			given(userMapper.toProfile(testUser)).willReturn(testProfile);

			// when
			Optional<Profile> result = userService.getUserById(1L);

			// then
			assertThat(result).isPresent();
			assertThat(result.get().getUserId()).isEqualTo(1L);  // ✅ getId() → getUserId()로 변경
			assertThat(result.get().getEmail()).isEqualTo("test@example.com");
			assertThat(result.get().getNickname()).isEqualTo("테스트유저");
		}

		@Test
		@DisplayName("닉네임으로 조회 성공")
		void getUserByNickname_성공() {
			// given
			given(userRepository.findByNickname("테스트유저")).willReturn(Optional.of(testUser));
			given(userMapper.toProfile(testUser)).willReturn(testProfile);

			// when
			Optional<Profile> result = userService.getUserByNickname("테스트유저");

			// then
			assertThat(result).isPresent();
			assertThat(result.get().getUserId()).isEqualTo(1L);  // ✅ getId() → getUserId()로 변경
			assertThat(result.get().getNickname()).isEqualTo("테스트유저");
			assertThat(result.get().getEmail()).isEqualTo("test@example.com");
		}
	}

	@Nested
	@DisplayName("사용자 정보 수정")
	class UpdateUserTest {

		@Test
		@DisplayName("성공 - 부분 업데이트")
		void updateUser_부분업데이트_성공() {
			// given
			UpdateRequest updateRequest = UpdateRequest.builder()
				.fullName("  수정된 이름  ")
				.age(35)
				.mentalState("improved")
				.build();

			given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));
			given(userRepository.save(testUser)).willReturn(testUser);

			Profile updatedProfile = Profile.builder()
				.userId(1L)  // ✅ id → userId로 변경
				.email("test@example.com")
				.nickname("테스트유저")
				.fullName("수정된 이름")
				.age(35)
				.gender("male")
				.mentalState("improved")
				.build();

			given(userMapper.toProfile(testUser)).willReturn(updatedProfile);

			// when
			Profile result = userService.updateUser("test@example.com", updateRequest);

			// then
			assertThat(result).isNotNull();
			assertThat(result.getUserId()).isEqualTo(1L);  // ✅ getId() → getUserId()로 변경
			assertThat(result.getFullName()).isEqualTo("수정된 이름");
			assertThat(result.getAge()).isEqualTo(35);
			assertThat(result.getMentalState()).isEqualTo("improved");

			verify(userMapper).applyUpdate(testUser, updateRequest);
			verify(userRepository).save(testUser);
		}

		@Test
		@DisplayName("실패 - 사용자 없음")
		void updateUser_사용자없음_NotFoundException() {
			// given
			UpdateRequest updateRequest = UpdateRequest.builder().fullName("수정된 이름").build();
			given(userRepository.findByEmail("nonexistent@example.com")).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> userService.updateUser("nonexistent@example.com", updateRequest))
				.isInstanceOf(NotFoundException.class)
				.hasMessage("사용자를 찾을 수 없습니다.");
		}
	}

	@Nested
	@DisplayName("소셜 사용자")
	class SocialUserTest {

		@Test
		@DisplayName("신규 소셜 사용자 생성")
		void findOrCreateSocialUser_신규생성_성공() {
			// given
			given(userRepository.findByEmail("social@example.com")).willReturn(Optional.empty());
			given(userRepository.existsByNickname("구글유저")).willReturn(false);

			UserEntity socialUser = UserEntity.builder()
				.userId(2L)
				.email("social@example.com")
				.fullName("구글유저")
				.nickname("구글유저")
				.provider("google")
				.socialId("google_1234567890123")
				.role("USER")
				.age(0)
				.gender("unknown")
				.password("")
				.termsAccepted(false)
				.createdAt(fixedTime)
				.updatedAt(fixedTime)
				.build();

			// ✅ any() 사용해서 유연한 스텁
			given(userMapper.createSocialUser(anyString(), anyString(), anyString(), anyString(), anyString()))
				.willReturn(socialUser);

			given(userRepository.save(socialUser)).willReturn(socialUser);

			// when
			UserEntity result = userService.findOrCreateSocialUser(
				"social@example.com",
				"구글유저",
				"google");

			// then
			assertThat(result).isNotNull();
			assertThat(result.getUserId()).isEqualTo(2L);

			// ✅ 구체적인 검증은 verify에서
			verify(userMapper).createSocialUser(
				eq("social@example.com"),
				eq("구글유저"),
				eq("구글유저"),
				eq("google"),
				anyString());
		}

		@Test
		@DisplayName("기존 소셜 사용자 반환")
		void findOrCreateSocialUser_기존사용자_반환() {
			// given
			UserEntity existingSocialUser = UserEntity.builder()
				.userId(1L)
				.email("existing@example.com")
				.nickname("기존유저")
				.provider("google")
				.socialId("google_existing_123")
				.build();

			given(userRepository.findByEmail("existing@example.com")).willReturn(Optional.of(existingSocialUser));

			// when - ✅ 원래 3개 매개변수로 호출
			UserEntity result = userService.findOrCreateSocialUser(
				"existing@example.com",
				"기존유저",  // 기존 사용자이므로 실제로는 사용되지 않음
				"google");

			// then
			assertThat(result).isEqualTo(existingSocialUser);
			assertThat(result.getUserId()).isEqualTo(1L);
			verify(userRepository, never()).save(any());  // 기존 사용자이므로 저장하지 않음
			verify(userMapper, never()).createSocialUser(anyString(), anyString(), anyString(), anyString(), anyString());
		}

		@Test
		@DisplayName("소셜 사용자 생성 - 닉네임 중복 시 유니크 생성")
		void findOrCreateSocialUser_닉네임중복_유니크생성() {
			// given
			given(userRepository.findByEmail("duplicate@example.com")).willReturn(Optional.empty());

			// ✅ 모든 가능한 호출에 대한 스텁
			given(userRepository.existsByNickname("duplicate_nick")).willReturn(true);
			given(userRepository.existsByNickname("duplicate_nick_1")).willReturn(false);

			UserEntity socialUser = UserEntity.builder()
				.userId(3L)
				.email("duplicate@example.com")
				.fullName("duplicate_nick")
				.nickname("duplicate_nick_1")
				.provider("kakao")
				.socialId("kakao_1234567890456")
				.role("USER")
				.build();

			given(userMapper.createSocialUser(
				eq("duplicate@example.com"),
				eq("duplicate_nick"),
				eq("duplicate_nick_1"),
				eq("kakao"),
				anyString()))
				.willReturn(socialUser);

			given(userRepository.save(socialUser)).willReturn(socialUser);

			// when
			UserEntity result = userService.findOrCreateSocialUser(
				"duplicate@example.com",
				"duplicate_nick",
				"kakao");

			// then
			assertThat(result.getNickname()).isEqualTo("duplicate_nick_1");
		}

		@Test
		@DisplayName("소셜 사용자 생성 - null 닉네임 처리")
		void findOrCreateSocialUser_null닉네임_기본값생성() {
			// given
			given(userRepository.findByEmail("nonick@example.com")).willReturn(Optional.empty());

			// ✅ 무한 루프 방지 - 기본값들은 모두 중복, 마지막에만 사용 가능
			given(userRepository.existsByNickname("naver_user")).willReturn(false);  // 첫 번째 시도에서 성공

			UserEntity socialUser = UserEntity.builder()
				.userId(4L)
				.email("nonick@example.com")
				.fullName("naver User")
				.nickname("naver_user")
				.provider("naver")
				.socialId("naver_1234567890789")
				.role("USER")
				.build();

			given(userMapper.createSocialUser(anyString(), anyString(), anyString(), anyString(), anyString()))
				.willReturn(socialUser);

			given(userRepository.save(socialUser)).willReturn(socialUser);

			// when
			UserEntity result = userService.findOrCreateSocialUser(
				"nonick@example.com",
				null,
				"naver");

			// then
			assertThat(result.getNickname()).isEqualTo("naver_user");

			// ✅ createSocialUser가 호출되었는지 검증
			verify(userMapper).createSocialUser(
				eq("nonick@example.com"),
				eq("naver User"),
				eq("naver_user"),
				eq("naver"),
				anyString());

			verify(userRepository).existsByNickname("naver_user");
		}
	}

	@Nested
	@DisplayName("가용성 확인")
	class AvailabilityTest {

		@Test
		@DisplayName("이메일 가용성 - 사용 가능")
		void isEmailAvailable_사용가능() {
			// given
			String email = "available@example.com";
			// ✅ normalize 스텁 추가
			given(userMapper.normalizeEmail(email)).willReturn(email);
			given(userRepository.existsByEmail(email)).willReturn(false);

			// when
			boolean result = userService.isEmailAvailable(email);

			// then
			assertThat(result).isTrue();
			verify(userMapper).normalizeEmail(email);
			verify(userRepository).existsByEmail(email);
		}

		@Test
		@DisplayName("닉네임 가용성 - 사용 불가")
		void isNicknameAvailable_사용불가() {
			// given
			String nickname = "사용불가닉네임";
			// ✅ normalize 스텁 추가
			given(userMapper.normalizeString(nickname)).willReturn(nickname);
			given(userRepository.existsByNickname(nickname)).willReturn(true);

			// when
			boolean result = userService.isNicknameAvailable(nickname);

			// then
			assertThat(result).isFalse();
			verify(userMapper).normalizeString(nickname);
			verify(userRepository).existsByNickname(nickname);
		}

		@Test
		@DisplayName("가용성 확인 - null/빈 값 처리")
		void availability_null빈값처리() {
			// when & then
			assertThat(userService.isEmailAvailable(null)).isFalse();
			assertThat(userService.isEmailAvailable("")).isFalse();
			assertThat(userService.isEmailAvailable("   ")).isFalse();

			assertThat(userService.isNicknameAvailable(null)).isFalse();
			assertThat(userService.isNicknameAvailable("")).isFalse();
			assertThat(userService.isNicknameAvailable("   ")).isFalse();
		}
	}

	@Nested
	@DisplayName("사용자 삭제")
	class DeleteUserTest {

		@Test
		@DisplayName("일반 삭제 성공")
		void deleteUser_성공() {
			// given
			given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));

			// when
			userService.deleteUser("test@example.com");

			// then
			verify(userRepository).delete(testUser);
		}

		@Test
		@DisplayName("재인증 후 삭제 성공")
		void deleteAccountWithReAuth_성공() {
			// given
			given(userRepository.findByEmail("test@example.com")).willReturn(Optional.of(testUser));
			doNothing().when(recentAuthenticationService)
				.requirePasswordReauth("test@example.com", "currentPassword123!");

			// when
			userService.deleteAccountWithReAuth("test@example.com", "currentPassword123!");

			// then
			verify(recentAuthenticationService).requirePasswordReauth("test@example.com", "currentPassword123!");
			verify(userRepository).delete(testUser);
		}

		@Test
		@DisplayName("삭제 실패 - 사용자 없음")
		void deleteUser_사용자없음_NotFoundException() {
			// given
			given(userRepository.findByEmail("nonexistent@example.com")).willReturn(Optional.empty());

			// when & then
			assertThatThrownBy(() -> userService.deleteUser("nonexistent@example.com"))
				.isInstanceOf(NotFoundException.class)
				.hasMessage("사용자를 찾을 수 없습니다.");
		}
	}

	@Nested
	@DisplayName("통계 및 유틸리티")
	class StatisticsTest {

		@Test
		@DisplayName("사용자 수 조회")
		void getUserCount_성공() {
			// given
			given(userRepository.count()).willReturn(1000L);

			// when
			long result = userService.getUserCount();

			// then
			assertThat(result).isEqualTo(1000L);
		}

		@Test
		@DisplayName("최근 가입자 조회")
		void getRecentUsers_성공() {
			// given
			given(userRepository.findTop10ByOrderByCreatedAtDesc())
				.willReturn(java.util.List.of(testUser));
			given(userMapper.toProfile(testUser)).willReturn(testProfile);

			// when
			java.util.List<Profile> result = userService.getRecentUsers();

			// then
			assertThat(result).hasSize(1);
			assertThat(result.get(0).getUserId()).isEqualTo(1L);  // ✅ getId() → getUserId()로 변경
			assertThat(result.get(0).getEmail()).isEqualTo("test@example.com");
			verify(userMapper).toProfile(testUser);
		}

		@Test
		@DisplayName("역할별 사용자 수 조회")
		void getUserCountByRole_성공() {
			// given
			given(userRepository.countByRole("USER")).willReturn(950L);
			given(userRepository.countByRole("ADMIN")).willReturn(50L);

			// when
			long userCount = userService.getUserCountByRole("USER");
			long adminCount = userService.getUserCountByRole("ADMIN");

			// then
			assertThat(userCount).isEqualTo(950L);
			assertThat(adminCount).isEqualTo(50L);
		}
	}

	@Nested
	@DisplayName("입력 검증")
	class ValidationTest {

		@Test
		@DisplayName("이메일 정규화 확인")
		void validateEmailNormalization() {
			// given
			String testEmail = "TEST@EXAMPLE.COM";
			String expectedEmail = "test@example.com";

			given(userMapper.normalizeEmail(testEmail)).willReturn(expectedEmail);
			given(userRepository.existsByEmail(expectedEmail)).willReturn(false);

			// when
			boolean result = userService.isEmailAvailable(testEmail);

			// then
			assertThat(result).isTrue();

			verify(userMapper).normalizeEmail(testEmail);  // ✅ 이제 호출됨
			verify(userRepository).existsByEmail(expectedEmail);
		}

		@Test
		@DisplayName("특수문자 포함 필드값 처리")
		void handleSpecialCharacters() {
			// given
			String emailWithSpecial = "test+label@example-domain.co.kr";
			String nicknameWithSpecial = "테스트_유저-123";

			// ✅ normalize 스텁들 추가
			given(userMapper.normalizeEmail(emailWithSpecial)).willReturn(emailWithSpecial);
			given(userMapper.normalizeString(nicknameWithSpecial)).willReturn(nicknameWithSpecial);
			given(userRepository.existsByEmail(emailWithSpecial)).willReturn(false);
			given(userRepository.existsByNickname(nicknameWithSpecial)).willReturn(false);

			// when
			boolean emailAvailable = userService.isEmailAvailable(emailWithSpecial);
			boolean nicknameAvailable = userService.isNicknameAvailable(nicknameWithSpecial);

			// then
			assertThat(emailAvailable).isTrue();
			assertThat(nicknameAvailable).isTrue();

			verify(userMapper).normalizeEmail(emailWithSpecial);
			verify(userMapper).normalizeString(nicknameWithSpecial);
		}
	}

	@Nested
	@DisplayName("동시성 테스트")
	class ConcurrencyTest {

		@Test
		@DisplayName("동일 이메일 동시 등록 시도 - 디버깅")
		void register_동시등록시도_ConflictException_debug() {
			// given
			RegistrationRequest concurrentRequest = RegistrationRequest.builder()
				.email("concurrent@example.com")
				.password("ConcurrentPass123!")
				.nickname("동시유저")
				.termsAccepted(true)
				.build();

			given(userMapper.normalizeEmail("concurrent@example.com")).willReturn("concurrent@example.com");
			given(userMapper.normalizeString("동시유저")).willReturn("동시유저");

			// ✅ lenient 스텁으로 모든 경우 커버
			lenient().when(userRepository.existsByEmail(anyString()))
				.thenReturn(false)   // 기본값
				.thenReturn(true);   // 두 번째 호출부터는 true

			given(userRepository.existsByNickname("동시유저")).willReturn(false);

			UserEntity mappedEntity = UserEntity.builder()
				.email("concurrent@example.com")
				.nickname("동시유저")
				.role("USER")
				.provider("local")
				.termsAccepted(true)
				.build();
			given(userMapper.toEntity(any(RegistrationRequest.class))).willReturn(mappedEntity);

			// when & then
			assertThatThrownBy(() -> userService.register(concurrentRequest))
				.isInstanceOf(ConflictException.class)
				.hasMessage("이미 사용중인 이메일입니다.");
		}
	}
}
