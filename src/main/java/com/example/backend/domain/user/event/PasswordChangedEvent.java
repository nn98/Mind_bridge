package com.example.backend.domain.user.event;

import com.example.backend.domain.common.DomainEvent;
import lombok.Getter;

@Getter
public class PasswordChangedEvent extends DomainEvent {

	private final String userId;
	private final String oldPasswordHash;
	private final String newPasswordHash;

	public PasswordChangedEvent(String userId, String oldPasswordHash, String newPasswordHash) {
		super();
		this.userId = userId;
		this.oldPasswordHash = oldPasswordHash;
		this.newPasswordHash = newPasswordHash;
	}
}
