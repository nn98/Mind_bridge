package com.example.backend.application.service;

import java.util.Map;

/**
 * SocialOAuthService
 * - provider(google|kakao) 기준으로 OAuth 로직을 캡슐화
 * - 컨트롤러는 이 서비스만 호출하여 인가 URL, 토큰 교환, 유저 정보 조회를 수행
 */
public interface SocialOAuthService {

	/**
	 * 인가 URL 생성
	 * @param provider "google" or "kakao"
	 * @return authorize URL (302 Location으로 사용)
	 */
	String buildAuthorizationUrl(String provider);

	/**
	 * code → access_token 교환
	 * @param provider "google" or "kakao"
	 * @param code authorization code
	 */
	String exchangeCodeForAccessToken(String provider, String code);

	/**
	 * 사용자 정보 조회(원본 맵), 필요시 디버깅/추가 필드 파생에 사용
	 */
	Map<String, Object> fetchRawUserInfo(String provider, String accessToken);

	/**
	 * 표준화된 추출(이메일/닉네임)
	 * - Google: email, name
	 * - Kakao: kakao_account.email, properties.nickname
	 */
	StandardUser extractStandardUser(String provider, Map<String, Object> raw);

	/**
	 * 표준 사용자 DTO
	 */
	record StandardUser(String email, String nickname) {}
}
