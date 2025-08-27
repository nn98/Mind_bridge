// service/UserServiceImpl.java
package com.example.backend.service;

import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.entity.UserEntity;
import com.example.backend.mapper.UserMapper;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
	private final UserRepository userRepository;

	@Override
	@Transactional(readOnly = true)
	public Optional<Profile> getUserByEmail(String email) {
		return userRepository.findByEmail(email).map(UserMapper::toProfile);
	}

	@Override
	@Transactional
	public Profile updateUser(String email, UpdateRequest req) {
		UserEntity u = userRepository.findByEmail(email)
			.orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
		UserMapper.applyUpdate(u, req);
		// JPA가 변경감지를 통해 업데이트 수행, 트랜잭션 커밋 시 flush
		// 즉시 최신 DTO 생성
		return UserMapper.toProfile(u);
	}
}
