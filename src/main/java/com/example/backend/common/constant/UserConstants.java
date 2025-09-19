package com.example.backend.common.constant;

public final class UserConstants {

	public static final class Role {
		public static final String USER = "USER";
		public static final String ADMIN = "ADMIN";
		public static final String SUPER_ADMIN = "SUPER_ADMIN";
		private Role() {}
	}

	public static final class Provider {
		public static final String LOCAL = "local";
		public static final String GOOGLE = "google";
		public static final String KAKAO = "kakao";
		private Provider() {}
	}

	public static final class Gender {
		public static final String MALE = "male";
		public static final String FEMALE = "female";
		public static final String OTHER = "other";
		public static final String UNKNOWN = "unknown";
		private Gender() {}
	}

	private UserConstants() {}
}
