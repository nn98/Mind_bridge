package com.example.backend.common.error;

import java.net.URI;

public final class Errors {
	public static final URI TYPE_VALIDATION   = URI.create("https://api.example.com/errors/validation");
	public static final URI TYPE_CONFLICT     = URI.create("https://api.example.com/errors/conflict");
	public static final URI TYPE_NOT_FOUND    = URI.create("https://api.example.com/errors/not-found");
	public static final URI TYPE_FORBIDDEN    = URI.create("https://api.example.com/errors/forbidden");
	public static final URI TYPE_UNAUTHORIZED = URI.create("https://api.example.com/errors/unauthorized");
	public static final URI TYPE_BAD_REQUEST = URI.create("https://api.example.com/errors/bad-request");

	private Errors() {}
}
