package com.example.backend.service;

import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.RegistrationRequest;
import com.example.backend.dto.user.Summary;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.entity.UserEntity;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 회원가입 처리
     */
    @Transactional
    public Profile register(RegistrationRequest request) {
        // 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("이미 사용중인 이메일입니다.");
        }

        // 닉네임 중복 확인
        if (userRepository.existsByNickname(request.getNickname())) {
            throw new RuntimeException("이미 사용중인 닉네임입니다.");
        }

        // 엔티티 생성 및 설정
        UserEntity user = createUserEntity(request);
        UserEntity savedUser = userRepository.save(user);

        log.info("새 사용자 가입 완료: {}", savedUser.getEmail());
        return new Profile(savedUser); // ✅ 생성자 사용
    }

    /**
     * 사용자 정보 업데이트
     */
    @Transactional
    public Profile updateUser(String email, UpdateRequest request) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 닉네임 변경 시 중복 확인
        if (request.getNickname() != null
                && !request.getNickname().equals(user.getNickname())
                && userRepository.existsByNickname(request.getNickname())) {
            throw new RuntimeException("이미 사용중인 닉네임입니다.");
        }

        // 업데이트 수행
        updateUserFields(user, request);
        UserEntity updatedUser = userRepository.save(user);

        log.info("사용자 정보 업데이트 완료: {}", email);
        return new Profile(updatedUser); // ✅ 생성자 사용
    }

    /**
     * 비밀번호 변경
     */
    @Transactional
    public Profile changePassword(String email, String newPassword) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        user.setPassword(passwordEncoder.encode(newPassword));
        UserEntity updatedUser = userRepository.save(user);

        log.info("비밀번호 변경 완료: {}", email);
        return new Profile(updatedUser); // ✅ 생성자 사용
    }

    /**
     * 사용자 조회 (이메일로)
     */
    public Optional<Profile> getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(Profile::new); // ✅ 생성자 참조 사용
    }

    /**
     * 사용자 조회 (닉네임으로)
     */
    public Optional<Summary> getUserByNickname(String nickname) {
        return userRepository.findByNickname(nickname)
                .map(Summary::new); // ✅ Summary도 생성자 참조 사용
    }

    /**
     * 사용자 삭제
     */
    @Transactional
    public void deleteUser(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        userRepository.delete(user);
        log.info("사용자 삭제 완료: {}", email);
    }

    /**
     * 이메일 중복 확인
     */
    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(email);
    }

    /**
     * 닉네임 중복 확인
     */
    public boolean isNicknameAvailable(String nickname) {
        return !userRepository.existsByNickname(nickname);
    }

    /**
     * 소셜 로그인용 사용자 찾기 또는 생성
     */
    @Transactional
    public UserEntity findOrCreateSocialUser(String email, String nickname) {
        Optional<UserEntity> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            log.info("기존 소셜 사용자 로그인: {}", email);
            return userOpt.get();
        } else {
            log.info("신규 소셜 사용자 자동 가입: {}", email);

            UserEntity newUser = new UserEntity();
            newUser.setEmail(email);
            newUser.setFullName(nickname != null ? nickname : "Google User");
            newUser.setNickname(generateUniqueNickname(nickname));
            newUser.setRole("USER");
            newUser.setPassword("");
            newUser.setAge(0);
            newUser.setGender("unspecified");

            return userRepository.save(newUser);
        }
    }

    /**
     * 구글 소셜 로그인용 사용자 찾기 또는 생성
     */
    @Transactional
    public UserEntity findOrCreateGoogleUser(String email, String nickname) {
        Optional<UserEntity> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            log.info("기존 구글 사용자 로그인: {}", email);
            return userOpt.get();
        } else {
            log.info("신규 구글 사용자 자동 가입: {}", email);
            UserEntity newUser = createGoogleUser(email, nickname);
            return userRepository.save(newUser);
        }
    }

    /**
     * 카카오 소셜 로그인용 사용자 찾기 또는 생성
     */
    @Transactional
    public UserEntity findOrCreateKakaoUser(String email, String nickname) {
        Optional<UserEntity> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            log.info("기존 카카오 사용자 로그인: {}", email);
            return userOpt.get();
        } else {
            log.info("신규 카카오 사용자 자동 가입: {}", email);
            UserEntity newUser = createKakaoUser(email, nickname);
            return userRepository.save(newUser);
        }
    }

    // === Private Helper Methods ===

    /**
     * 회원가입 요청으로부터 UserEntity 생성
     */
    private UserEntity createUserEntity(RegistrationRequest request) {
        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setNickname(request.getNickname());
        user.setGender(request.getGender());
        user.setAge(request.getAge());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setMentalState(request.getMentalState());
        user.setRole("USER");
        return user;
    }

    /**
     * 사용자 필드 업데이트
     */
    private void updateUserFields(UserEntity user, UpdateRequest request) {
        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getMentalState() != null) {
            user.setMentalState(request.getMentalState());
        }
        if (request.getChatGoal() != null) {
            user.setChatGoal(request.getChatGoal());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
    }

    /**
     * 구글 사용자 생성
     */
    private UserEntity createGoogleUser(String email, String nickname) {
        UserEntity newUser = new UserEntity();
        newUser.setEmail(email);
        newUser.setFullName(nickname != null ? nickname : "Google User");
        newUser.setNickname(generateUniqueNickname(nickname, "google"));
        newUser.setRole("USER");
        newUser.setPassword("");
        newUser.setAge(0);
        newUser.setGender("unspecified");
        return newUser;
    }

    /**
     * 카카오 사용자 생성
     */
    private UserEntity createKakaoUser(String email, String nickname) {
        UserEntity newUser = new UserEntity();
        newUser.setEmail(email);
        newUser.setFullName(nickname != null ? nickname : "Kakao User");
        newUser.setNickname(generateUniqueNickname(nickname, "kakao"));
        newUser.setRole("USER");
        newUser.setPassword("");
        newUser.setAge(0);
        newUser.setGender("unspecified");
        return newUser;
    }

    private String generateUniqueNickname(String preferredName) {
        String baseNickname = (preferredName != null && !preferredName.trim().isEmpty())
                ? preferredName.trim()
                : "user";

        String nickname = baseNickname;
        int suffix = 1;

        while (!isNicknameAvailable(nickname)) {
            nickname = baseNickname + "_" + suffix++;
            if (suffix > 100) {
                nickname = "user_" + System.currentTimeMillis();
                break;
            }
        }

        return nickname;
    }

    private String generateUniqueNickname(String preferredName, String provider) {
        String baseNickname = (preferredName != null && !preferredName.trim().isEmpty())
                ? preferredName.trim()
                : provider + "_user";

        if (baseNickname.length() > 15) {
            baseNickname = baseNickname.substring(0, 15);
        }

        String nickname = baseNickname;
        int suffix = 1;

        while (!isNicknameAvailable(nickname)) {
            nickname = baseNickname + "_" + suffix++;
            if (suffix > 100) {
                nickname = provider + "_" + System.currentTimeMillis();
                break;
            }
        }

        return nickname;
    }
}

