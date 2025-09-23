package com.example.backend.dto.chat;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ChatMessageType {
	USER("USER"),
	AI("AI");

	private final String value;

	ChatMessageType(String value) {
		this.value = value;
	}

	@JsonValue
	public String getValue() {
		return value;
	}

	@JsonCreator
	public static ChatMessageType fromValue(String value) {
		for (ChatMessageType type : ChatMessageType.values()) {
			if (type.value.equals(value)) {
				return type;
			}
		}
		throw new IllegalArgumentException("Unknown message type: " + value);
	}
}
