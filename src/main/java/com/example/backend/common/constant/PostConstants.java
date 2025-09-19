package com.example.backend.common.constant;

public final class PostConstants {

	public static final class Visibility {
		public static final String PUBLIC = "public";
		public static final String PRIVATE = "private";
		private Visibility() {}
	}

	public static final class Status {
		public static final String ACTIVE = "active";
		public static final String DELETED = "deleted";
		private Status() {}
	}

	private PostConstants() {}
}
