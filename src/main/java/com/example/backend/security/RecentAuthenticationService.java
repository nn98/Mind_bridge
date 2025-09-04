package com.example.backend.security;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecentAuthenticationService {

	private final AuthenticationManager authenticationManager;

	public void requirePasswordReauth(String currentUsername, String rawPassword) {
		try {
			UsernamePasswordAuthenticationToken token =
				new UsernamePasswordAuthenticationToken(currentUsername, rawPassword);
			Authentication result = authenticationManager.authenticate(token);

			if (!result.isAuthenticated() || !currentUsername.equals(result.getName())) {
				throw new AccessDeniedException("Reauthentication failed");
			}
		} catch (AuthenticationException ex) {
			throw new AccessDeniedException("Current password verification failed", ex);
		}
	}
}
