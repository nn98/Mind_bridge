import axios from "axios";
import { BACKEND_URL } from "./env";

// 로그인
export const apiLogin = (email, password) =>
    axios.post(`${BACKEND_URL}/api/auth/login`, { email, password }, { withCredentials: true });

// 로그아웃
export const apiLogout = () =>
    axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });

// 회원가입
export const apiRegister = (payload) =>
    axios.post(`${BACKEND_URL}/api/users/register`, payload, { withCredentials: true });

// 이메일 중복 체크
export const apiCheckEmail = (email) =>
    axios.get(`${BACKEND_URL}/api/users/check-email`, {
        params: { email },
        withCredentials: true,
    });

// 아이디 찾기
export const apiFindId = (payload) =>
    axios.post(`${BACKEND_URL}/api/auth/find-id`, payload, { withCredentials: true });

// 비밀번호 찾기(임시 비번 발급)
export const apiResetPassword = (payload) =>
    axios.post(`${BACKEND_URL}/api/auth/reset-password`, payload, { withCredentials: true });

// 소셜 로그인(코드 교환)
export const apiSocialLogin = (provider, code) =>
    axios.post(`${BACKEND_URL}/api/auth/social-login`, { provider, code }, { withCredentials: true });

// 닉네임 중복확인
export const apiCheckNickname = (nickname) =>
    axios.get(`${BACKEND_URL}/api/users/${nickname}`, { withCredentials: true });

