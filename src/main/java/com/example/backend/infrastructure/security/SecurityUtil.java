package com.example.backend.infrastructure.security;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtil {

	public String requirePrincipalEmail(Authentication authentication) {
		if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
			throw new AuthenticationCredentialsNotFoundException("Authentication required");
		}
		// principal 캐스팅이 필요한 경우:
		// Object principal = auth.getPrincipal();
		// if (principal instanceof UserDetails u) return u.getUsername();
		// else throw new AuthenticationCredentialsNotFoundException("Unsupported principal");
		return authentication.getName();
	}

	public String requirePrincipalFromUserDetails(Authentication authentication) {
		if (authentication == null) {
			throw new AuthenticationCredentialsNotFoundException("Authentication required");
		}
		Object principal = authentication.getPrincipal();
		if (principal instanceof UserDetails u) {
			return u.getUsername();
		}
		throw new AuthenticationCredentialsNotFoundException("Unsupported principal");
	}
}
