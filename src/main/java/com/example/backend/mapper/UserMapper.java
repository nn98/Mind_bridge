package com.example.backend.mapper;

import org.springframework.stereotype.Component;
import com.example.backend.dto.user.Profile;
import com.example.backend.dto.user.UpdateRequest;
import com.example.backend.entity.UserEntity;

@Component
public class UserMapper {

	public Profile toProfile(UserEntity u) {
		if (u == null) return null;
		Profile p = new Profile();
		p.setId(u.getId());
		p.setEmail(u.getEmail());
		p.setFullName(u.getFullName());
		p.setNickname(u.getNickname());
		p.setGender(u.getGender());
		p.setAge(u.getAge());
		p.setPhoneNumber(u.getPhoneNumber());
		p.setMentalState(u.getMentalState());
		p.setChatGoal(u.getChatGoal());
		p.setRole(u.getRole());
		p.setCreatedAt(u.getCreatedAt());
		p.setUpdatedAt(u.getUpdatedAt());
		p.setProvider(u.getProvider());
		return p;
	}

	private String norm(String s) {
		return s == null ? null : s.trim();
	}
	private String emptyToNull(String s) {
		if (s == null) return null;
		String t = s.trim();
		return t.isEmpty() ? null : t;
	}

	// 부분 업데이트 적용
	public void applyUpdate(UserEntity user, UpdateRequest req) {
		if (req.getNickname() != null)      user.setNickname(norm(req.getNickname()));
		if (req.getMentalState() != null)   user.setMentalState(emptyToNull(req.getMentalState()));
		if (req.getChatGoal() != null)      user.setChatGoal(emptyToNull(req.getChatGoal()));
		if (req.getPhoneNumber() != null)   user.setPhoneNumber(emptyToNull(req.getPhoneNumber()));
		if (req.getFullName() != null)      user.setFullName(emptyToNull(req.getFullName()));
		if (req.getAge() != null)           user.setAge(req.getAge());
		if (req.getGender() != null)        user.setGender(emptyToNull(req.getGender()));
	}
}
